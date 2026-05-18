type FormState = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+]?[\d\s\(\)\-]{7,20}$/;

export function initForm(): void {
  const form = document.getElementById('contactForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    '.form__input, .form__textarea'
  ).forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('form__input--error')) {
        validateField(field);
      }
    });
  });
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;

  if (!validateForm(form)) return;

  const data = Object.fromEntries(new FormData(form));

  setFormState('loading');

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        response.status === 404
          ? 'API не найден. Запустите: npm run dev:all'
          : `Ошибка сервера (${response.status})`
      );
    }

    const result: { success?: boolean; error?: string; aiReply?: string } =
      await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? 'Ошибка отправки');
    }

    setFormState(
      'success',
      result.aiReply
        ? `Сообщение отправлено! ${result.aiReply}`
        : 'Сообщение отправлено! Ожидайте ответа на почте.'
    );
    form.reset();
  } catch (err) {
    setFormState(
      'error',
      err instanceof Error ? err.message : 'Не удалось отправить. Попробуйте позже.'
    );
  }
}

function validateForm(form: HTMLFormElement): boolean {
  let valid = true;
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    '[required]'
  ).forEach((field) => {
    if (!validateField(field)) valid = false;
  });
  return valid;
}

function validateField(field: HTMLInputElement | HTMLTextAreaElement): boolean {
  const errorEl = document.getElementById(`${field.id}Error`);
  const value = field.value.trim();

  if (field.hasAttribute('required') && !value) {
    showError(field, errorEl, 'Это поле обязательно');
    return false;
  }

  if ((field as HTMLInputElement).type === 'email' && value && !EMAIL_RE.test(value)) {
    showError(field, errorEl, 'Введите корректный email');
    return false;
  }

  if ((field as HTMLInputElement).type === 'tel' && value && !PHONE_RE.test(value)) {
    showError(field, errorEl, 'Введите корректный номер');
    return false;
  }

  clearError(field, errorEl);
  return true;
}

function showError(field: Element, errorEl: Element | null, message: string): void {
  field.classList.add('form__input--error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('form__error--visible');
  }
}

function clearError(field: Element, errorEl: Element | null): void {
  field.classList.remove('form__input--error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('form__error--visible');
  }
}

function setFormState(state: FormState, message?: string): void {
  const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;
  const btnText = submitBtn?.querySelector<HTMLElement>('.btn__text');
  const btnSpinner = submitBtn?.querySelector<HTMLElement>('.btn__spinner');
  const statusEl = document.getElementById('formStatus') as HTMLElement | null;

  if (!submitBtn) return;

  submitBtn.disabled = state === 'loading';

  if (btnSpinner) btnSpinner.hidden = state !== 'loading';
  if (btnText) btnText.textContent = state === 'loading' ? 'Отправка...' : 'Отправить';

  if (statusEl) {
    statusEl.hidden = state === 'idle' || state === 'loading';
    statusEl.className = `form__status form__status--${state}`;
    statusEl.textContent = message ?? '';
  }
}
