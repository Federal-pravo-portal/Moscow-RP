import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const authGuest = document.getElementById("authGuest");
const authProfile = document.getElementById("authProfile");
const authProfileName = document.getElementById("authProfileName");
const authProfileBadge = document.getElementById("authProfileBadge");

// Ищем или создаём контейнер для аватара внутри кнопки профиля
function ensureAvatarEl() {
  if (!authProfile) return null;
  let img = authProfile.querySelector('.auth-avatar');
  if (!img) {
    img = document.createElement('img');
    img.className = 'auth-avatar';
    img.alt = '';
    img.style.display = 'none';
    const svg = authProfile.querySelector('svg');
    if (svg) authProfile.insertBefore(img, svg);
    else authProfile.prepend(img);
  }
  return img;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (authGuest) authGuest.style.display = "inline-flex";
    if (authProfile) authProfile.style.display = "none";
    return;
  }

  if (authGuest) authGuest.style.display = "none";
  if (authProfile) authProfile.style.display = "inline-flex";

  if (authProfileName) {
    authProfileName.textContent = user.displayName || user.email || "Профиль";
  }

  // 🖼 Аватар: сначала берём из Firestore users/{uid}.photoUrl,
  // если нет — из user.photoURL, если и тут нет — стандартная SVG.
  let photoUrl = '';
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists() && snap.data().photoUrl) {
      photoUrl = snap.data().photoUrl;
    } else if (user.photoURL) {
      photoUrl = user.photoURL;
    }
    if (snap.exists() && snap.data().nickname) {
      authProfileName.textContent = snap.data().nickname;
    }
  } catch (e) {
    console.warn("Не удалось прочитать users/" + user.uid, e);
    photoUrl = user.photoURL || '';
  }

  const avatarImg = ensureAvatarEl();
  const defaultSvg = authProfile.querySelector('svg');

  if (avatarImg) {
    if (photoUrl) {
      avatarImg.src = photoUrl;
      avatarImg.style.display = 'inline-block';
      if (defaultSvg) defaultSvg.style.display = 'none';
    } else {
      avatarImg.style.display = 'none';
      if (defaultSvg) defaultSvg.style.display = '';
    }
  }

  // 🏷 Бейдж роли
  try {
    const token = await user.getIdTokenResult();
    const role = token.claims.role || "citizen";

    if (authProfileBadge) {
      authProfileBadge.style.background = "#fff";
      authProfileBadge.style.fontSize = "10px";
      authProfileBadge.style.fontWeight = "800";
      authProfileBadge.style.letterSpacing = ".02em";
      authProfileBadge.style.padding = "3px 6px";
      authProfileBadge.style.borderRadius = "4px";

      if (role === "government") {
        authProfileBadge.textContent = "Правительство";
        authProfileBadge.style.display = "inline-block";
        authProfileBadge.style.color = "#c9a24a";
      } else if (role === "editor") {
        authProfileBadge.textContent = "Администратор";
        authProfileBadge.style.display = "inline-block";
        authProfileBadge.style.color = "#c9a24a";
      } else if (role === "citizen") {
        authProfileBadge.textContent = "Гражданин РФ";
        authProfileBadge.style.display = "inline-block";
        authProfileBadge.style.color = "#777";
      } else {
        authProfileBadge.textContent = "";
        authProfileBadge.style.display = "none";
      }
    }
  } catch (e) {
    console.error("Ошибка получения токена:", e);
  }
});

// Кнопка «Выйти»
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#logoutBtn");
  if (!btn) return;
  e.preventDefault();
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Ошибка выхода:", err);
  }
});