/* =========================================================
   api.js — единственный слой общения с сервером.

   КОНТРАКТ (его же имитирует mock-api.js):

     Успех  → HTTP 200/201, тело: { "user": { ... } }  либо { "ok": true }
     Ошибка → HTTP 400, тело:
              { "message": "Проверьте поля",
                "errors": { "email": "Уже занят", "password": "Слишком короткий" } }
     Не авторизован → HTTP 401

   Любой ответ приходит в код страницы одинаково:
   успех — обычное значение, ошибка — исключение ApiError с полями
   .status, .message и .errors (объект «имя поля → текст ошибки»).
   ========================================================= */

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message || 'Ошибка запроса');
    this.name = 'ApiError';
    this.status = status || 0;
    this.errors = errors || {};      // ошибки по полям формы
  }
}
window.ApiError = ApiError;

window.Api = (function () {
  const cfg = window.APP_CONFIG;

  /* Читаем cookie (нужно для CSRF-токена Django) */
  function getCookie(name) {
    const found = document.cookie.split('; ').find(function (row) {
      return row.indexOf(name + '=') === 0;
    });
    return found ? decodeURIComponent(found.split('=').slice(1).join('=')) : null;
  }

  /* Базовый запрос. data — обычный объект, уходит как JSON. */
  async function request(path, options) {
    const opts = options || {};
    const method = (opts.method || 'GET').toUpperCase();

    /* Демо-режим: тот же самый вызов, но обрабатывает заглушка.
       Формат ответа и ошибок совпадает — переключение флага ничего не ломает. */
    if (cfg.USE_MOCK) {
      return window.MockApi.handle(path, method, opts.data || null);
    }

    const headers = { 'Accept': 'application/json' };
    let body;

    if (opts.data instanceof FormData) {
      body = opts.data;                                   // файлы: Content-Type ставит браузер сам
    } else if (opts.data) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.data);
    }

    if (method !== 'GET' && method !== 'HEAD') {
      const csrf = getCookie(cfg.CSRF_COOKIE);
      if (csrf) headers[cfg.CSRF_HEADER] = csrf;
    }

    let response;
    try {
      response = await fetch(cfg.API_BASE + path, {
        method: method,
        headers: headers,
        body: body,
        credentials: cfg.WITH_CREDENTIALS ? 'include' : 'same-origin'
      });
    } catch (e) {
      /* сюда попадаем при выключенном сервере, обрыве сети или запрете CORS */
      throw new ApiError('Сервер не отвечает. Проверьте, что бэкенд запущен.', 0, {});
    }

    /* Пустой ответ (204) — возвращаем пустой объект */
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (e) {
        if (!response.ok) throw new ApiError('Сервер вернул не JSON (код ' + response.status + ')', response.status, {});
        payload = {};
      }
    }

    if (!response.ok) {
      throw new ApiError(
        payload.message || payload.detail || defaultMessage(response.status),
        response.status,
        normalizeErrors(payload.errors || payload)
      );
    }

    return payload;
  }

  function defaultMessage(status) {
    if (status === 401) return 'Нужно войти в аккаунт';
    if (status === 403) return 'Доступ запрещён';
    if (status === 404) return 'Адрес не найден — проверьте ENDPOINTS в config.js';
    if (status >= 500) return 'Ошибка на сервере';
    return 'Не удалось выполнить запрос';
  }

  /* Django REST отдаёт ошибки как {"email": ["Уже занят"]} — приводим к строкам. */
  function normalizeErrors(raw) {
    const result = {};
    if (!raw || typeof raw !== 'object') return result;

    Object.keys(raw).forEach(function (key) {
      if (key === 'message' || key === 'detail') return;
      const value = raw[key];
      if (Array.isArray(value)) result[key] = String(value[0]);
      else if (typeof value === 'string') result[key] = value;
    });
    return result;
  }

  /* --- Методы, которыми пользуются страницы --- */

  const E = cfg.ENDPOINTS;

  return {
    request: request,
    register: function (data) { return request(E.register, { method: 'POST', data: data }); },
    login:    function (data) { return request(E.login,    { method: 'POST', data: data }); },
    logout:   function ()     { return request(E.logout,   { method: 'POST' }); },
    me:       function ()     { return request(E.me); },
    updateProfile:  function (data) { return request(E.profile,  { method: 'PATCH', data: data }); },
    changePassword: function (data) { return request(E.password, { method: 'POST',  data: data }); }
  };
})();
