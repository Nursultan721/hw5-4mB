/* Настройки frontend API. Для реального backend замените USE_MOCK на false. */
window.APP_CONFIG = {
  USE_MOCK: true,
  API_BASE: "",
  WITH_CREDENTIALS: true,
  CSRF_COOKIE: "csrftoken",
  CSRF_HEADER: "X-CSRFToken",
  USER_CACHE_KEY: "nexo_user",
  ENDPOINTS: {
    register: "/api/auth/register/",
    login: "/api/auth/login/",
    logout: "/api/auth/logout/",
    me: "/api/auth/me/",
    profile: "/api/profile/",
    password: "/api/profile/password/",
  },
  ROUTES: {
    guest: "/login-page/",
    afterLogin: "/profile/",
    afterRegister: "/profile/",
    afterLogout: "/",
  },
};
