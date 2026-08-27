/* =========================================================
   session.js — кто сейчас в аккаунте.

   Источник правды — сервер (GET /auth/me). В localStorage лежит
   только копия для мгновенной отрисовки шапки: если сервер скажет
   401, копия немедленно стирается.
   ========================================================= */

window.Session = (function () {
  const cfg = window.APP_CONFIG;

  function cached() {
    try { return JSON.parse(localStorage.getItem(cfg.USER_CACHE_KEY)); }
    catch (e) { return null; }
  }

  function set(user) {
    if (user) localStorage.setItem(cfg.USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(cfg.USER_CACHE_KEY);
    return user || null;
  }

  function clear() { set(null); }

  /* Спрашиваем сервер. Вернёт объект пользователя или null. */
  async function refresh() {
    try {
      const result = await window.Api.me();
      return set(result.user);
    } catch (error) {
      if (error instanceof window.ApiError && error.status === 401) {
        clear();
        return null;
      }
      /* сеть недоступна — оставляем кэш, чтобы страница не мигала */
      return cached();
    }
  }

  /* Защита страницы: если гость — уводим на вход и возвращаем null. */
  async function requireAuth() {
    if (!cached()) {
      window.location.replace(cfg.ROUTES.guest);
      return null;
    }

    const user = await refresh();
    if (!user) window.location.replace(cfg.ROUTES.guest);
    return user;
  }

  /* Выход: сначала сервер, потом чистим кэш в любом случае. */
  async function logout(redirect) {
    try { await window.Api.logout(); }
    catch (e) { /* даже если сервер недоступен — локально разлогиниваем */ }

    clear();
    window.location.href = redirect || cfg.ROUTES.afterLogout;
  }

  return {
    cached: cached,
    set: set,
    clear: clear,
    refresh: refresh,
    requireAuth: requireAuth,
    logout: logout
  };
})();
