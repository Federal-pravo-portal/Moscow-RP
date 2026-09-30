// js/auth-header.js
// Автоматически перестраивает шапку и добавляет кнопку входа / профиля

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------- Стили ----------
(function injectStyles() {
  if (document.getElementById('auth-header-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-header-styles';
  style.textContent = `
    /* Grid из 3 колонок. Наложение исключено. */
    .site-header {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) !important;
      align-items: center !important;
      gap: 16px !important;
      position: relative !important;
    }
    .site-header__left {
      grid-column: 1;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      justify-self: start !important;
      min-width: 0 !important;
    }
    .site-header__center {
      grid-column: 2;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      justify-self: center !important;
      min-width: 0 !important;
    }
    .site-header__right {
      grid-column: 3;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      justify-self: end !important;
    }

    /* Сброс абсолютного позиционирования у заголовка */
    .site-header__title,
    .site-header__center .site-header__title {
      position: static !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
      transform: none !important;
      margin: 0 !important;
      white-space: nowrap !important;
    }

    .site-header__auth-slot {
      display: inline-flex;
      align-items: center;
      gap: 8px;
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
    .site-header__auth--outline {
      background: transparent;
      border: 1.5px solid #c9a24a;
      color: #c9a24a;
    }
    .site-header__auth--outline:hover {
      background: #c9a24a;
      color: #fff;
    }
    .site-header__auth svg { flex-shrink: 0; }
    .site-header__auth-name {
      max-width: 130px;
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
      .site-header { gap: 10px !important; }
    }
    @media (max-width: 900px) {
      .site-header__auth { padding: 7px 10px; font-size: 13px; }
      .site-header__auth-name { max-width: 80px; }
      .site-header__auth-badge { font-size: 9px; padding: 2px 5px; }
      .site-header__auth--register { display: none !important; }
    }
    @media (max-width: 700px) {
      .site-header {
        grid-template-columns: minmax(0, 1fr) auto !important;
        grid-template-areas:
          "left right"
          "center center" !important;
        gap: 8px 12px !important;
      }
      .site-header__left { grid-area: left; }
      .site-header__right { grid-area: right; }
      .site-header__center {
        grid-area: center;
        justify-self: start !important;
        justify-content: flex-start !important;
      }
    }
    @media (max-width: 600px) {
      .site-header__auth-name { display: none; }
    }
  `;
  document.head.appendChild(style);
})();

// ---------- Кнопки ----------
function renderGuest(slot) {
  slot.innerHTML = `
    <a href="login.html" class="site-header__auth site-header__auth--outline" title="Войти">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      <span>Войти</span>
    </a>
    <a href="register.html" class="site-header__auth site-header__auth--register" title="Зарегистрироваться">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

// ---------- Перестройка шапки в 3 зоны ----------
function restructureHeader(header) {
  if (header.querySelector('.site-header__left')) return;

  const menu = header.querySelector('.site-header__menu');
  const title = header.querySelector('.site-header__title');
  const icons = Array.from(header.querySelectorAll('.site-header__discord'));

  const left = document.createElement('div');
  left.className = 'site-header__left';
  const center = document.createElement('div');
  center.className = 'site-header__center';
  const right = document.createElement('div');
  right.className = 'site-header__right';

  if (menu) left.appendChild(menu);
  if (title) center.appendChild(title);
  icons.forEach((i) => right.appendChild(i));

  header.innerHTML = '';
  header.appendChild(left);
  header.appendChild(center);
  header.appendChild(right);
}

// ---------- Инициализация ----------
function init() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  restructureHeader(header);

  const right = header.querySelector('.site-header__right');
  let slot = right.querySelector('.site-header__auth-slot');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'site-header__auth-slot';
    right.insertBefore(slot, right.firstChild);
  }

  renderGuest(slot);

  onAuthStateChanged(auth, async (user) => {
    if (!user) { renderGuest(slot); return; }
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
