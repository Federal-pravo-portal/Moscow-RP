// js/auth-header.js
// Автоматически вставляет в шапку кнопку "Войти" или "Профиль"

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------- Стили ----------
(function injectStyles() {
  if (document.getElementById('auth-header-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-header-styles';
  style.textContent = `
    .site-header { position: relative; }
    .site-header__right {
      position: absolute;
      right: 24px;
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      gap: 12px;
      z-index: 5;
    }
    .site-header__auth-slot {
      display: inline-flex;
      align-items: center;
    }
    .site-header__auth {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: #c9a24a;
      border-radius: 8px;
      text-decoration: none;
      transition: opacity 0.2s ease, transform 0.15s ease;
      white-space: nowrap;
      line-height: 1;
    }
    .site-header__auth:hover {
      opacity: 0.88;
      transform: translateY(-1px);
    }
    .site-header__auth svg { flex-shrink: 0; }
    .site-header__auth-name {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .site-header__auth-badge {
      background: #fff;
      color: #c9a24a;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 3px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    @media (max-width: 1100px) {
      .site-header__right { right: 16px; gap: 8px; }
    }
    @media (max-width: 900px) {
      .site-header__auth { padding: 7px 10px; font-size: 13px; }
      .site-header__auth-name { max-width: 90px; }
      .site-header__auth-badge { font-size: 9px; padding: 2px 5px; }
    }
    @media (max-width: 640px) {
      .site-header__auth-name { display: none; }
      .site-header__right { gap: 6px; }
    }
  `;
  document.head.appendChild(style);
})();

// ---------- Разметка ----------
function renderGuest(slot) {
  slot.innerHTML = `
    <a href="login.html" class="site-header__auth" title="Войти или зарегистрироваться">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      <span>Войти</span>
    </a>
  `;
}

function renderUser(slot, user, isAdmin) {
  const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Профиль');
  const safeName = name.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c]));

  slot.innerHTML = `
    <a href="profile.html" class="site-header__auth" title="Личный кабинет">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span class="site-header__auth-name">${safeName}</span>
      ${isAdmin ? '<span class="site-header__auth-badge">admin</span>' : ''}
    </a>
  `;
}

// ---------- Инициализация ----------
function init() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  // Убедимся, что header relative
  if (getComputedStyle(header).position === 'static') {
    header.style.position = 'relative';
  }

  // Создаём правую группу, если её нет
  let rightGroup = header.querySelector('.site-header__right');
  if (!rightGroup) {
    rightGroup = document.createElement('div');
    rightGroup.className = 'site-header__right';

    // Переносим все иконки (поиск, discord)
    const icons = header.querySelectorAll('.site-header__discord');
    icons.forEach((icon) => rightGroup.appendChild(icon));

    header.appendChild(rightGroup);
  }

  // Слот для кнопки
  let slot = rightGroup.querySelector('.site-header__auth-slot');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'site-header__auth-slot';
    rightGroup.insertBefore(slot, rightGroup.firstChild);
  }

  renderGuest(slot);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      renderGuest(slot);
      return;
    }
    let isAdmin = false;
    try {
      const token = await user.getIdTokenResult();
      isAdmin = token.claims.role === 'admin';
    } catch (e) {}
    renderUser(slot, user, isAdmin);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}