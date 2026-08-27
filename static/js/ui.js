/* =========================================================
   ui.js — интерфейс: меню, состояние шапки, кнопки выхода,
   показ пароля, всплывающие сообщения. К данным отношения не имеет.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initBurger();
  initLogout();
  initPasswordPeek();
  paintNav(window.Session.cached());       // мгновенно — по кэшу
  fillYear();

  /* и уточняем у сервера */
  window.Session.refresh().then(paintNav);
});

/* Мобильное меню */
function initBurger() {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', function () {
    nav.classList.toggle('is-open');
  });
}

/* Показываем гостю одни пункты меню, авторизованному — другие.
   Управляется атрибутами data-auth="guest" / data-auth="user". */
function paintNav(user) {
  document.querySelectorAll('[data-auth="guest"]').forEach(function (el) {
    el.classList.toggle('hidden', Boolean(user));
  });
  document.querySelectorAll('[data-auth="user"]').forEach(function (el) {
    el.classList.toggle('hidden', !user);
  });
  document.querySelectorAll('[data-user-name]').forEach(function (el) {
    if (user) el.textContent = user.name;
  });
}

/* Любая кнопка с data-logout выходит из аккаунта */
function initLogout() {
  document.querySelectorAll('[data-logout]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      btn.disabled = true;
      window.Session.logout(btn.dataset.logout || undefined);
    });
  });
}

/* Кнопка «глаз» рядом с полем пароля */
function initPasswordPeek() {
  document.querySelectorAll('[data-peek]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const input = document.getElementById(btn.dataset.peek);
      if (!input) return;

      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      btn.textContent = hidden ? '🙈' : '👁';
      btn.setAttribute('aria-label', hidden ? 'Скрыть пароль' : 'Показать пароль');
    });
  });
}

function fillYear() {
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
}

/* Всплывающее сообщение: Toast.show('Сохранено', 'ok') */
window.Toast = {
  show: function (message, type) {
    let stack = document.querySelector('.toasts');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toasts';
      document.body.appendChild(stack);
    }

    const item = document.createElement('div');
    item.className = 'toast toast--' + (type || 'ok');
    item.textContent = message;
    stack.appendChild(item);

    setTimeout(function () { item.remove(); }, 3200);
  }
};
