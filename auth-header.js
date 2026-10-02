// js/auth-header.js — обновляет шапку сайта в зависимости от авторизации и роли.

import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============================================================
// НАЗВАНИЯ РОЛЕЙ — что показывать в бейдже
// ============================================================
const ROLE_LABELS = {
  "admin":       "Администратор",
  "government":  "Правительство",
  "ap":          "Администрация Президента",
  "mvd":         "МВД РФ",
  "fsb":         "ФСБ РФ",
  "fsin":        "ФСИН РФ",
  "prokuratura": "Прокуратура РФ",
  "sk":          "Следственный комитет",
  "minoborony":  "Министерство обороны",
  "minzdrav":    "Министерство здравоохранения",
  "minust":      "Министерство юстиции",
  "mchs":        "МЧС России",
  "cik":         "ЦИК РФ",
  "sb":          "Совет Безопасности",
  "fs":          "Совет Федерации",
  "regiony":     "Региональные администрации",
  "sudy":        "Суды РФ",
  "editor":      "Редактор",
  "citizen":     "Гражданин РФ"
};

// Цвета бейджей для разных ролей
const ROLE_COLORS = {
  "admin":       "#c9302c",   // красный
  "government":  "#c9a24a",   // золотой
  "ap":          "#c9a24a",
  "fsb":         "#2f4f4f",   // тёмно-серый
  "mvd":         "#1a3a5c",   // тёмно-синий
  "prokuratura": "#3a5c1a",   // тёмно-зелёный
  "sk":          "#4a1a5c",   // фиолетовый
  "minoborony":  "#5c3a1a",   // коричневый
  "minzdrav":    "#1a5c4a",   // бирюзовый
  "minust":      "#3a3a5c",   // сине-серый
  "mchs":        "#c9302c",
  "cik":         "#5c1a3a",
  "sb":          "#2f4f4f",
  "fs":          "#c9a24a",
  "regiony":     "#3a3a3a",
  "sudy":        "#4a4a4a"
};

// ============================================================
// ОБНОВЛЕНИЕ ШАПКИ
// ============================================================
onAuthStateChanged(auth, async (user) => {
  const guestEl = document.getElementById("authGuest");
  const profileEl = document.getElementById("authProfile");
  const nameEl = document.getElementById("authProfileName");
  const badgeEl = document.getElementById("authProfileBadge");

  if (!user) {
    // Не залогинен
    if (guestEl) guestEl.style.display = "inline-flex";
    if (profileEl) profileEl.style.display = "none";
    return;
  }

  // Залогинен
  if (guestEl) guestEl.style.display = "none";
  if (profileEl) profileEl.style.display = "inline-flex";

  // Получаем клеймы
  let role = "citizen";
  let sections = [];
  try {
    const token = await user.getIdTokenResult();
    role = token.claims.role || "citizen";
    sections = Array.isArray(token.claims.sections) ? token.claims.sections : [];
  } catch (e) {
    console.warn("Не удалось получить claims:", e);
  }

  // Имя
  const displayName = user.displayName 
                    || (user.email || "").split("@")[0] 
                    || "Профиль";
  if (nameEl) nameEl.textContent = displayName;

  // Бейдж с ролью
  if (badgeEl) {
    const label = ROLE_LABELS[role] || "Гражданин РФ";

    // Бейдж показываем всегда (даже для citizen) — но по-разному
    badgeEl.style.display = "inline-block";
    badgeEl.textContent = label;

    // Цвет
    const color = ROLE_COLORS[role];
    if (color) {
      badgeEl.style.background = "#fff";
      badgeEl.style.color = color;
    } else {
      // Для citizen и неизвестных ролей — приглушённый
      badgeEl.style.background = "#fff";
      badgeEl.style.color = "#c9a24a";
    }
  }
});