// js/section-list.js
// Универсальный модуль отображения списка публикаций раздела.
//
// Использование в HTML:
//   <script type="module">
//     import { initSectionList } from "./js/section-list.js";
//     initSectionList({ section: "mvd", listId: "sbList", addBlockId: "newPublicationBlock" });
//   </script>

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, query, where, getDocs, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { canEdit, getClaims, toggleEl } from "./permissions.js";

export function initSectionList({ section, listId, addBlockId }) {
  const listEl = document.getElementById(listId);
  if (!listEl) {
    console.warn("Не найден список:", listId);
    return;
  }

  let claims = { role: "citizen", sections: [] };

  loadPublications();

  async function loadPublications() {
    try {
      const q = query(collection(db, "publications"), where("section", "==", section));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const items = [];
      snap.forEach((d) => items.push({ id: d.id, data: d.data() }));
      items.sort((a, b) => (b.data.createdAt?.toMillis?.() || 0) - (a.data.createdAt?.toMillis?.() || 0));

      listEl.innerHTML = items.map(renderItem).join("");
      updateDeleteBtns();
    } catch (err) {
      console.error(err);
    }
  }

  function renderItem(item) {
    const d = item.data;
    return `
      <li class="dyn-pub" data-doc-id="${item.id}">
        <button class="dyn-pub__delete" type="button" data-id="${item.id}" data-title="${esc(d.title)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <a class="dyn-pub__link" href="publication.html?id=${item.id}">
          <h2 class="dyn-pub__title">${esc(d.title || "Без названия")}</h2>
          <p class="dyn-pub__date">
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M3 0h6l3 3v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5 1v3h3L8 1z"/></svg>
            <span>${formatDate(d.createdAt)}</span>
          </p>
          ${d.subtitle ? `<p class="dyn-pub__desc">${esc(d.subtitle)}</p>` : ""}
        </a>
      </li>`;
  }

  onAuthStateChanged(auth, async (user) => {
    claims = await getClaims(user);
    toggleEl(document.getElementById(addBlockId), canEdit(section, claims), "block");
    updateDeleteBtns();
  });

  function updateDeleteBtns() {
    const show = canEdit(section, claims);
    document.querySelectorAll(".dyn-pub__delete").forEach((btn) => {
      btn.classList.toggle("is-visible", show);
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (id) handleDelete(id, btn.getAttribute("data-title"));
      };
    });
  }

  async function handleDelete(docId, title) {
    if (!confirm("Удалить публикацию?\n\n«" + title + "»\n\nДействие необратимо.")) return;
    try {
      await deleteDoc(doc(db, "publications", docId));
      document.querySelector('.dyn-pub[data-doc-id="' + docId + '"]')?.remove();
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const m = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear() + " года";
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }
}