import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const authGuest = document.getElementById("authGuest");
const authProfile = document.getElementById("authProfile");
const authProfileName = document.getElementById("authProfileName");
const authProfileBadge = document.getElementById("authProfileBadge");

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

  try {
    const token = await user.getIdTokenResult();
    const role = token.claims.role || "citizen";

    if (authProfileBadge) {
      authProfileBadge.style.background = "#fff";
      authProfileBadge.style.color = "#c9a24a";
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

// Кнопка «Выйти» — обрабатывается по id="logoutBtn"
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