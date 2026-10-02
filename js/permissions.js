// js/permissions.js
// Единый модуль проверки прав на основе Firebase Custom Claims.
// Клеймы: { role, sections }

import { auth } from "./firebase-config.js";

/**
 * Возвращает объект { role, sections } текущего пользователя.
 */
export async function getClaims(user) {
  if (!user) return { role: "citizen", sections: [] };
  try {
    const token = await user.getIdTokenResult();
    return {
      role: token.claims.role || "citizen",
      sections: Array.isArray(token.claims.sections) ? token.claims.sections : []
    };
  } catch (e) {
    console.warn("Не удалось получить claims:", e);
    return { role: "citizen", sections: [] };
  }
}

/**
 * Может ли пользователь создавать/редактировать/удалять публикации в разделе.
 * Используется для:
 *   - обычных разделов (mvd, fsb, postanovleniya, ...)
 *   - вкладок внутри организации (org-XXX-tab)
 *   - сущностей officials/organizations (для внутренней проверки)
 */
export function canEdit(section, claims) {
  if (!claims) return false;
  const role = claims.role || "citizen";
  const sections = claims.sections || [];

  // Админ — всё
  if (role === "admin") return true;

  // Правительство — руководство/организации + свои разделы
  if (role === "government") {
    if (section === "officials" || section === "organizations") return true;
    if (sections.includes("*")) return true;
    return sections.includes(section);
  }

  // Остальные роли — только свои разделы
  if (sections.includes("*")) return true;
  return sections.includes(section);
}

/**
 * Может ли пользователь управлять карточками руководства.
 * Только admin и government.
 */
export function canManageOfficials(claims) {
  if (!claims) return false;
  return claims.role === "admin" || claims.role === "government";
}

/**
 * Может ли пользователь редактировать карточку организации (карандаш/крестик).
 * @param {string} orgSection — значение поля `section` организации из Firestore
 * @param {{role:string, sections:string[]}} claims
 * @param {boolean} strictMode — true: government видит только свою карточку. false: government видит все.
 */
export function canEditOrgCard(orgSection, claims, strictMode = false) {
  if (!claims) return false;
  const role = claims.role || "citizen";
  const sections = claims.sections || [];

  // Админ — всегда всё
  if (role === "admin") return true;

  // Правительство
  if (role === "government") {
    if (strictMode) {
      // Строгий режим — только своя карточка
      return orgSection === "government";
    }
    // Мягкий режим — все карточки
    return true;
  }

  // Остальные роли — только своя карточка
  if (!orgSection) return false;
  if (sections.includes("*")) return true;
  return sections.includes(orgSection);
}

export function canDeleteAny(claims) {
  if (!claims) return false;
  return claims.role === "admin";
}

export function toggleEl(el, show, displayMode = "block") {
  if (!el) return;
  el.style.display = show ? displayMode : "none";
}