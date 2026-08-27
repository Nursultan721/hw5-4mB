/* =========================================================
   register.js — страница регистрации.
   Вся отправка идёт через Forms.bind + Api.register.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  const routes = window.APP_CONFIG.ROUTES;

  /* Авторизованному тут делать нечего */
  if (window.Session.cached()) {
    window.location.replace(routes.afterRegister);
    return;
  }

  window.Forms.bind('registerForm', {

    /* Быстрая проверка на клиенте — чтобы не гонять заведомо плохие данные.
       Настоящая проверка всё равно на сервере, ей же верим окончательно. */
    validate: function (v) {
      const errors = {};

      if (v.name.length < 2) errors.name = 'Имя должно быть не короче 2 символов';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errors.email = 'Введите корректный e-mail';
      if (v.password.length < 8) errors.password = 'Пароль должен быть не короче 8 символов';
      if (v.password2 !== v.password) errors.password2 = 'Пароли не совпадают';
      if (!v.agree) errors.agree = 'Подтвердите согласие с условиями';

      return errors;
    },

    submit: function (v) {
      return window.Api.register({
        name: v.name,
        email: v.email,
        password: v.password,
        password2: v.password2,
        agree: v.agree
      });
    },

    successMessage: 'Аккаунт создан. Открываем профиль…',

    success: function (result) {
      window.Session.set(result.user);
      setTimeout(function () {
        window.location.href = routes.afterRegister;
      }, 700);
    }
  });
});
