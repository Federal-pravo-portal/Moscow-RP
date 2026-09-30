// js/auth-header.js
// Просто переключает видимость кнопок. Ничего не создаёт.

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  const guest = document.getElementById('authGuest');
  const profileBtn = document.getElementById('authProfile');
  if (!guest || !profileBtn) return;

  if (!user) {
    guest.style.display = 'inline-flex';
    profileBtn.style.display = 'none';
    return;
  }

  guest.style.display = 'none';
  profileBtn.style.display = 'inline-flex';

  const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Профиль');
  const nameEl = document.getElementById('authProfileName');
  if (nameEl) nameEl.textContent = name;

  const badge = document.getElementById('authProfileBadge');
  if (badge) {
    try {
      const token = await user.getIdTokenResult();
      badge.style.display = token.claims.role === 'admin' ? 'inline-block' : 'none';
    } catch (e) {
      badge.style.display = 'none';
    }
  }
});