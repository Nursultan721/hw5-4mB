/* =========================================================
   login.js — страница входа.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  const routes = window.APP_CONFIG.ROUTES;

  if (window.Session.cached()) {
    window.location.replace(routes.afterLogin);
    return;
  }

  window.Forms.bind('loginForm', {

    validate: function (v) {
      const errors = {};
      if (!v.email) errors.email = 'Введите e-mail';
      if (!v.password) errors.password = 'Введите пароль';
      return errors;
    },

    submit: function (v) {
      return window.Api.login({ email: v.email, password: v.password });
    },

    success: function (result) {
      window.Session.set(result.user);

      /* ?next=... — куда вернуть после входа (например, с закрытой страницы) */
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next || routes.afterLogin;
    }
  });
});
