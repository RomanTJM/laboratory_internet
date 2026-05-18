const ROLES = [
  'React / TypeScript',
  'Vue.js',
  'Full-Stack разработке',
  'AI-интеграциях',
  'SPA-приложениях',
];

export function initTyped(elementId: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  function tick(): void {
    const current = ROLES[roleIndex];

    if (!isDeleting) {
      el!.textContent = current.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === current.length) {
        isDeleting = true;
        timeoutId = setTimeout(tick, 2200);
        return;
      }
    } else {
      el!.textContent = current.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % ROLES.length;
      }
    }

    timeoutId = setTimeout(tick, isDeleting ? 45 : 85);
  }

  timeoutId = setTimeout(tick, 600);

  window.addEventListener('beforeunload', () => clearTimeout(timeoutId));
}
