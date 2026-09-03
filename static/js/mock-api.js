/* =========================================================
   mock-api.js — ЗАГЛУШКА бэкенда на localStorage.

   Нужна только чтобы шаблон работал без сервера. Отвечает ровно
   в том же формате, что описан в api.js, поэтому переключение
   APP_CONFIG.USE_MOCK = false не требует правок ни в разметке,
   ни в скриптах страниц.

   Когда появится настоящий бэкенд — выключите USE_MOCK и можете
   удалить этот файл вместе со строкой <script> в HTML.

   ВАЖНО: пароли тут хранятся в браузере в base64. Это не защита,
   а имитация. Настоящая проверка пароля — только на сервере.
   ========================================================= */

window.MockApi = (function () {
  const cfg = window.APP_CONFIG;
  const USERS_KEY = 'nexo_mock_users';
  const SESSION_KEY = 'nexo_mock_session';
  const DELAY = 280;                     // имитация задержки сети

  /* --- хранилище --- */

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function encode(password) {
    return btoa(unescape(encodeURIComponent(password)));
  }

  function publicUser(user) {
    /* пароль наружу не отдаём — так же ведёт себя настоящий API */
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city || '',
      about: user.about || '',
      date_joined: user.date_joined
    };
  }

  function currentUser() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return readUsers().find(function (u) { return String(u.id) === id; }) || null;
  }

  function fail(message, errors, status) {
    throw new window.ApiError(message, status || 400, errors || {});
  }

  /* --- обработчики «эндпоинтов» --- */

  const handlers = {};
  const E = cfg.ENDPOINTS;

  handlers['POST ' + E.register] = function (data) {
    const errors = {};
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const password2 = String(data.password2 || '');

    if (name.length < 2) errors.name = 'Имя должно быть не короче 2 символов';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Введите корректный e-mail';
    if (password.length < 8) errors.password = 'Пароль должен быть не короче 8 символов';
    else if (/^\d+$/.test(password)) errors.password = 'Пароль не может состоять только из цифр';
    if (password2 !== password) errors.password2 = 'Пароли не совпадают';
    if (!data.agree) errors.agree = 'Подтвердите согласие с условиями';

    const users = readUsers();
    if (!errors.email && users.some(function (u) { return u.email === email; })) {
      errors.email = 'Этот e-mail уже зарегистрирован';
    }

    if (Object.keys(errors).length) fail('Проверьте заполнение формы', errors);

    const user = {
      id: Date.now(),
      name: name,
      email: email,
      password: encode(password),
      city: '',
      about: '',
      date_joined: new Date().toISOString()
    };

    users.push(user);
    writeUsers(users);
    localStorage.setItem(SESSION_KEY, String(user.id));   // сразу «входим», как и настоящий сервер

    return { user: publicUser(user) };
  };

  handlers['POST ' + E.login] = function (data) {
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const errors = {};

    if (!email) errors.email = 'Введите e-mail';
    if (!password) errors.password = 'Введите пароль';
    if (Object.keys(errors).length) fail('Заполните поля', errors);

    const user = readUsers().find(function (u) {
      return u.email === email && u.password === encode(password);
    });

    /* Одна общая ошибка: не подсказываем, существует ли такой e-mail */
    if (!user) fail('Неверный e-mail или пароль', {});

    localStorage.setItem(SESSION_KEY, String(user.id));
    return { user: publicUser(user) };
  };

  handlers['POST ' + E.logout] = function () {
    localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  };

  handlers['GET ' + E.me] = function () {
    const user = currentUser();
    if (!user) fail('Нужно войти в аккаунт', {}, 401);
    return { user: publicUser(user) };
  };

  handlers['PATCH ' + E.profile] = function (data) {
    const user = currentUser();
    if (!user) fail('Нужно войти в аккаунт', {}, 401);

    const errors = {};
    const name = String(data.name || '').trim();
    const about = String(data.about || '').trim();

    if (name.length < 2) errors.name = 'Имя должно быть не короче 2 символов';
    if (about.length > 500) errors.about = 'Не больше 500 символов';
    if (Object.keys(errors).length) fail('Проверьте заполнение формы', errors);

    const users = readUsers();
    const index = users.findIndex(function (u) { return u.id === user.id; });

    users[index] = Object.assign({}, users[index], {
      name: name,
      city: String(data.city || '').trim(),
      about: about
    });
    writeUsers(users);

    return { user: publicUser(users[index]) };
  };

  handlers['POST ' + E.password] = function (data) {
    const user = currentUser();
    if (!user) fail('Нужно войти в аккаунт', {}, 401);

    const errors = {};
    const current = String(data.current_password || '');
    const next = String(data.password || '');
    const next2 = String(data.password2 || '');

    if (encode(current) !== user.password) errors.current_password = 'Текущий пароль неверный';
    if (next.length < 8) errors.password = 'Пароль должен быть не короче 8 символов';
    if (next !== next2) errors.password2 = 'Пароли не совпадают';
    if (Object.keys(errors).length) fail('Проверьте заполнение формы', errors);

    const users = readUsers();
    const index = users.findIndex(function (u) { return u.id === user.id; });
    users[index].password = encode(next);
    writeUsers(users);

    return { ok: true };
  };

  /* --- маршрутизация --- */

  function handle(path, method, data) {
    const key = method + ' ' + path;

    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        const handler = handlers[key];

        if (!handler) {
          reject(new window.ApiError('Демо-режим не знает адрес ' + key, 404, {}));
          return;
        }

        try {
          resolve(handler(data || {}));
        } catch (e) {
          reject(e);                    // ApiError уходит наверх как обычная ошибка запроса
        }
      }, DELAY);
    });
  }

  return { handle: handle };
})();
