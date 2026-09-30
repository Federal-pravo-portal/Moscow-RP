// js/auth-header.js
// Кнопки авторизации в шапке + иконка профиля

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ---------- Стили ----------
(function injectStyles() {
  if (document.getElementById('auth-header-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-header-styles';
  style.textContent = `
    .site-header__auth-wrap {
      position: absolute;
      right: 24px;
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      gap: 10px;
      z-index: 20;
    }
    .site-header__auth {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      color: #fff;
      background: #c9a24a;
      border-radius: 8px;
      border: none;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      line-height: 1;
      transition: opacity .2s ease, transform .15s ease;
    }
    .site-header__auth:hover {
      opacity: .88;
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
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .05em;
      padding: 3px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    @media (max-width: 900px) {
      .site-header__auth-wrap { right: 16px; gap: 8px; }
      .site-header__auth { padding: 7px 10px; font-size: 12px; }
      .site-header__auth-name { max-width: 80px; }
      .site-header__auth--register { display: none; }
    }
    @media (max-width: 640px) {
      .site-header__auth-wrap { right: 12px; }
      .site-header__auth-name { display: none; }
      .site-header__auth-badge { display: none; }
    }
  `;
  document.head.appendChild(style);
})();

// ---------- Разметка ----------
function renderGuest(wrap) {
  wrap.innerHTML = `
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

function renderUser(wrap, user, isAdmin) {
  const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Профиль');
  const safeName = String(name).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c]));

  wrap.innerHTML = `
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

  // Если шапка статичная — делаем relative, чтобы absolute-обёртка работала.
  // Если она уже absolute/fixed/relative (как на главной) — не трогаем.
  const pos = getComputedStyle(header).position;
  if (pos === 'static') {
    header.style.position = 'relative';
  }

  // Создаём обёртку
  let wrap = header.querySelector('.site-header__auth-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'site-header__auth-wrap';
    header.appendChild(wrap);
  }

  renderGuest(wrap);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      renderGuest(wrap);
      return;
    }
    let isAdmin = false;
    try {
      const token = await user.getIdTokenResult();
      isAdmin = token.claims.role === 'admin';
    } catch (e) {}
    renderUser(wrap, user, isAdmin);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}