import './styles/main.scss';
import { initTyped } from './modules/typed';
import { initForm } from './modules/form';

initTyped('typedRole');
initForm();

function initScrollAnimations(): void {
  const elements = document.querySelectorAll<Element>('[data-animate]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

function initNav(): void {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');

  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger?.addEventListener('click', () => {
    const isOpen = links?.classList.toggle('nav__links--open');
    burger.classList.toggle('nav__burger--open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen ?? false));
  });

  links?.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('nav__links--open');
      burger?.classList.remove('nav__burger--open');
      burger?.setAttribute('aria-expanded', 'false');
    });
  });
}

function initActiveNavLink(): void {
  const sections = document.querySelectorAll<HTMLElement>('section[id]');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav__link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const href = link.getAttribute('href')?.slice(1);
            link.classList.toggle('nav__link--active', href === entry.target.id);
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((s) => observer.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollAnimations();
  initActiveNavLink();
});
