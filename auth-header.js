// js/auth-header.js
// Кнопки входа/регистрации в шапке + иконка профиля

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------- Стили ----------
(function injectStyles() {
  if (document.getElementById('auth-header-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-header-styles';
  style.textContent = `
    /* Правая группа в шапке — абсолютно прижата к правому краю */
    .site-header {
      position: relative !important;
    }
    .site-header__right {
      position: absolute !important;
      right: 24px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 10px !important;
      z-index: 10 !important;
    }

    .site-header__auth-slot {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    /* Кнопки */
    .site-header__auth {
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      padding: 8px 14px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      font-family: inherit !important;
      color: #fff !important;
      background: #c9a24a !important;
      border-radius: 8px !important;
      border: none !important;
      text-decoration: none !important;
      cursor: pointer !important;
      white-space: nowrap !important;
      line-height: 1 !important;
      transition: opacity .2s ease, transform .15s ease !important;
    }
    .site-header__auth:hover {
      opacity: .88 !important;
      transform: translateY(-1px) !important;
    }
    .site-header__auth--outline {
      background: transparent !important;
      border: 1.5px solid #c9a24a !important;
      color: #c9a24a !important;
    }
    .site-header__auth--outline:hover {
      background: #c9a24a !important;
      color: #fff !important;
    }
    .site-header__auth svg { flex-shrink: 0 !important; }
    .site-header__auth-name {
      max-width: 130px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    .site-header__auth-badge {
      background: #fff !important;
      color: #c9a24a !important;
      font-size: 9px !important;
      font-weight: 800 !important;
      letter-spacing: .05em !important;
      padding: 3px 6px !important;
      border-radius: 4px !important;
      text-transform: uppercase !important;
    }

    /* Мобильные */
    @media (max-width: 900px) {
      .site-header__right { right: 16px !important; gap: 8px !important; }
      .site-header__auth { padding: 7px 10px !important; font-size: 12px !important; }
      .site-header__auth-name { max-width: 80px !important; }
      .site-header__auth--register { display: none !important; }
    }
    @media (max-width: 640px) {
      .site-header__right { right: 12px !important; }
      .site-header__auth-name { display: none !important; }
      .site-header__auth-badge { display: none !important; }
    }
  `;
  document.head.appendChild(style);
})();

// ---------- Разметка кнопок ----------
function renderGuest(slot) {
  slot.innerHTML = `
    <a href="login.html" class="site-header__auth site-header__auth--outline" title="Войти">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      <span>Войти</span>
    </a>
    <a href="register.html" class="site-header__auth site-header__auth--register" title="Зарегистрироваться">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
      <span>Регистрация</span>
    </a>
  `;
}

function renderUser(slot, user, isAdmin) {
  const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Профиль');
  const safeName = String(name).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c]));

  slot.innerHTML = `
    <a href="profile.html" class="site-header__auth" title="Личный кабинет">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

  // Создаём правую группу (если её нет)
  let rightGroup = header.querySelector('.site-header__right');
  if (!rightGroup) {
    rightGroup = document.createElement('div');
    rightGroup.className = 'site-header__right';

    // Переносим в неё все иконки .site-header__discord
    const icons = Array.from(header.querySelectorAll('.site-header__discord'));
    icons.forEach((icon) => rightGroup.appendChild(icon));

    header.appendChild(rightGroup);
  }

  // Слот для кнопок авторизации
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
    } catch (e) { /* игнорируем */ }
    renderUser(slot, user, isAdmin);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}