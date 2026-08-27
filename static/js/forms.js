/* =========================================================
   forms.js — универсальная обвязка форм.

   Почему так: в разметке лежит НАСТОЯЩАЯ форма
   (<form method="post" action="...">, у каждого поля есть name).
   Скрипт только перехватывает отправку, чтобы показать ошибки
   без перезагрузки. Если JS не загрузился или вы решите
   рендерить страницы на сервере — форма отправится сама,
   обычным POST на свой action. Ломаться нечему.

   Ошибки сервера приходят как { "errors": { "email": "текст" } }
   и раскладываются по полям автоматически — по совпадению
   name поля и ключа в ответе.
   ========================================================= */

window.Forms = (function () {

  /* Собираем значения формы в обычный объект.
     Чекбокс → true/false, остальное → строка без пробелов по краям. */
  function values(form) {
    const data = {};

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || el.type === 'submit' || el.type === 'button') return;

      if (el.type === 'checkbox') data[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else if (el.type === 'password') data[el.name] = el.value;      // пробелы в пароле значимы
      else data[el.name] = el.value.trim();
    });

    return data;
  }

  /* --- ошибки полей --- */

  function fieldError(form, name, message) {
    const input = form.querySelector('[name="' + name + '"]');
    const slot = form.querySelector('[data-error="' + name + '"]');

    if (slot) slot.textContent = message || '';
    if (input) input.classList.toggle('is-invalid', Boolean(message));
  }

  function setErrors(form, errors) {
    const unknown = [];

    Object.keys(errors || {}).forEach(function (name) {
      if (form.querySelector('[name="' + name + '"]') || form.querySelector('[data-error="' + name + '"]')) {
        fieldError(form, name, errors[name]);
      } else {
        unknown.push(errors[name]);        // поле, которого нет в форме — покажем в общем баннере
      }
    });

    const first = form.querySelector('.is-invalid');
    if (first) first.focus();

    return unknown;
  }

  function clearErrors(form) {
    form.querySelectorAll('[data-error]').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    notice(form, '');
  }

  /* --- общий баннер над формой --- */

  function notice(form, message, type) {
    const box = form.querySelector('[data-notice]') ||
                document.querySelector('[data-notice="' + form.id + '"]');
    if (!box) return;

    box.textContent = message || '';
    box.className = 'notice' + (message ? ' is-visible notice--' + (type || 'error') : '');
  }

  /* --- состояние кнопки --- */

  function loading(form, on) {
    const button = form.querySelector('[type="submit"]');
    if (!button) return;

    button.classList.toggle('is-loading', on);
    button.disabled = on;

    if (on) {
      button.dataset.label = button.textContent;
      button.textContent = button.dataset.loadingText || 'Отправляем…';
    } else if (button.dataset.label) {
      button.textContent = button.dataset.label;
    }
  }

  /* --- главный метод ---

     options:
       validate(values)  → объект ошибок или null   (проверка на клиенте, необязательно)
       submit(values)    → Promise                  (запрос на сервер)
       success(result)                              (что делать после успеха)
       successMessage    → текст в зелёном баннере
  */
  function bind(formOrId, options) {
    const form = typeof formOrId === 'string' ? document.getElementById(formOrId) : formOrId;
    if (!form) return;

    /* Гасим встроенные подсказки браузера — тексты ошибок у нас свои */
    form.setAttribute('novalidate', 'novalidate');

    /* Ошибка поля исчезает, как только его начали править */
    form.addEventListener('input', function (e) {
      if (e.target.name) fieldError(form, e.target.name, '');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();               // отправляем через fetch; без JS сработал бы обычный POST
      clearErrors(form);

      const data = values(form);

      if (options.validate) {
        const errors = options.validate(data) || {};
        if (Object.keys(errors).length) {
          const unknown = setErrors(form, errors);
          if (unknown.length) notice(form, unknown[0], 'error');
          return;
        }
      }

      loading(form, true);

      try {
        const result = await options.submit(data);

        if (options.successMessage) notice(form, options.successMessage, 'success');
        if (options.success) options.success(result, data);

      } catch (error) {
        if (error instanceof window.ApiError) {
          const unknown = setErrors(form, error.errors);
          const hasFieldErrors = Object.keys(error.errors || {}).length > unknown.length;

          /* Общий баннер показываем, если ошибка не легла ни на одно поле */
          if (!hasFieldErrors) notice(form, unknown[0] || error.message, 'error');

        } else {
          notice(form, 'Непредвиденная ошибка: ' + error.message, 'error');
          console.error(error);
        }

      } finally {
        loading(form, false);
      }
    });
  }

  return {
    bind: bind,
    values: values,
    setErrors: setErrors,
    clearErrors: clearErrors,
    fieldError: fieldError,
    notice: notice,
    loading: loading
  };
})();
