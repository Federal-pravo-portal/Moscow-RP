// js/auth-header.js
// Только наполняет существующий контейнер кнопками

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

function init() {
  const wrap = document.getElementById('authWrap');
  if (!wrap) return;

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