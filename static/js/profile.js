/* =========================================================
   profile.js — личный кабинет: данные, редактирование, пароль.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async function () {

  initTabs();

  /* Страница только для авторизованных: гостя уводит на вход */
  const user = await window.Session.requireAuth();
  if (!user) return;

  render(user);
  document.querySelector('.profile').classList.remove('hidden');

  /* --- форма профиля --- */

  window.Forms.bind('profileForm', {

    validate: function (v) {
      const errors = {};
      if (v.name.length < 2) errors.name = 'Имя должно быть не короче 2 символов';
      if (v.about.length > 500) errors.about = 'Не больше 500 символов';
      return errors;
    },

    submit: function (v) {
      return window.Api.updateProfile({ name: v.name, city: v.city, about: v.about });
    },

    success: function (result) {
      window.Session.set(result.user);
      render(result.user);
      window.Toast.show('Изменения сохранены', 'ok');
    }
  });

  /* --- форма смены пароля --- */

  window.Forms.bind('passwordForm', {

    validate: function (v) {
      const errors = {};
      if (!v.current_password) errors.current_password = 'Введите текущий пароль';
      if (v.password.length < 8) errors.password = 'Пароль должен быть не короче 8 символов';
      if (v.password2 !== v.password) errors.password2 = 'Пароли не совпадают';
      return errors;
    },

    submit: function (v) {
      return window.Api.changePassword({
        current_password: v.current_password,
        password: v.password,
        password2: v.password2
      });
    },

    success: function () {
      document.getElementById('passwordForm').reset();
      window.Toast.show('Пароль обновлён', 'ok');
    }
  });
});

/* Заполняет карточку и форму данными пользователя */
function render(user) {
  const form = document.getElementById('profileForm');

  setText('[data-field="initials"]', initials(user.name || user.email));
  setText('[data-field="name"]', user.name);
  setText('[data-field="email"]', user.email);
  setText('[data-field="city"]', user.city || '—');
  setText('[data-field="about"]', user.about || '—');
  setText('[data-field="id"]', '#' + user.id);
  setText('[data-field="date"]', formatDate(user.date_joined));

  /* form.elements — надёжнее, чем form.name: не путается с атрибутом формы */
  form.elements.name.value = user.name || '';
  form.elements.city.value = user.city || '';
  form.elements.about.value = user.about || '';
}

/* Вкладки «Обзор / Настройки / Безопасность» */
function initTabs() {
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('is-active'); });

      tab.classList.add('is-active');
      const panel = document.getElementById(tab.dataset.tab);
      if (panel) panel.classList.add('is-active');
    });
  });
}

/* --- мелкие помощники --- */

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(function (el) {
    el.textContent = value;
  });
}

function initials(value) {
  const parts = String(value).trim().split(/\s+/);
  return parts.slice(0, 2).map(function (p) { return p.charAt(0); }).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}
