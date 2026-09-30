// js/publications.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PAGE_SECTION = {
  'ukazy':          'ukazy',
  'ap':             'ap',
  'postanovleniya': 'postanovleniya',
  'zak-sobranie':   'zak-sobranie',
  'cik':            'cik',
  'sb':             'sb'
};

const fileName = window.location.pathname.split('/').pop().replace(/\.html$/, '');
const section = PAGE_SECTION[fileName];

if (section) {
  injectStyles();
  const ul = document.querySelector('.ukazy-list, .post-list, .zs-list, .cik-list, .sb-list');
  if (ul) loadPublications(section, ul);
}

function injectStyles() {
  if (document.getElementById('dyn-pub-styles')) return;
  const style = document.createElement('style');
  style.id = 'dyn-pub-styles';
  style.textContent = `
    .dyn-pub { padding: 24px 0; border-bottom: 1px solid #e8e8e8; position: relative; }
    .dyn-pub:first-child { padding-top: 0; }
    .dyn-pub:last-child { border-bottom: none; padding-bottom: 0; }
    .dyn-pub__link { display: block; color: inherit; text-decoration: none; transition: opacity 0.2s ease; padding-right: 44px; }
    .dyn-pub__link:hover { opacity: 0.75; }
    .dyn-pub__title { font-size: 22px; font-weight: 700; color: #111; margin: 0 0 10px; line-height: 1.3; letter-spacing: 0.01em; text-transform: uppercase; }
    .dyn-pub__date { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; color: #666; margin: 0 0 10px; line-height: 1.4; }
    .dyn-pub__date svg { color: #c9a24a; flex-shrink: 0; }
    .dyn-pub__desc { font-size: 16px; color: #333; margin: 0; line-height: 1.6; }
    .dyn-pub__delete { position: absolute; top: 24px; right: 0; width: 32px; height: 32px; border-radius: 50%; background: #fff; border: 1px solid #e0b5b3; color: #c9302c; cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0; z-index: 2; }
    .dyn-pub__delete.is-visible { display: inline-flex; }
    .dyn-pub__delete:hover { background: #c9302c; color: #fff; }
    @media (max-width: 640px) {
      .dyn-pub { padding: 18px 0; }
      .dyn-pub__title { font-size: 17px; }
      .dyn-pub__date { font-size: 14px; }
      .dyn-pub__desc { font-size: 15px; }
      .dyn-pub__delete { top: 18px; width: 28px; height: 28px; }
    }
  `;
  document.head.appendChild(style);
}

async function loadPublications(section, ul) {
  try {
    const q = query(collection(db, 'publications'), where('section', '==', section));
    const snap = await getDocs(q);
    console.log('[publications] ' + section + ' → найдено:', snap.size);
    if (snap.empty) return;

    const items = [];
    snap.forEach((d) => items.push({ id: d.id, data: d.data() }));
    items.sort((a, b) => {
      const ta = a.data.createdAt && a.data.createdAt.toMillis ? a.data.createdAt.toMillis() : 0;
      const tb = b.data.createdAt && b.data.createdAt.toMillis ? b.data.createdAt.toMillis() : 0;
      return tb - ta;
    });

    ul.insertAdjacentHTML('beforeend', items.map(renderItem).join(''));
    updateDeleteBtns(window.__currentRole || 'citizen');
  } catch (err) {
    console.error('[publications] ошибка:', err);
  }
}

function renderItem(item) {
  const d = item.data;
  const date = formatDate(d.createdAt);
  const title = esc(d.title || 'Публикация');
  const desc = esc(d.subtitle || '');

  return `
    <li class="dyn-pub" data-doc-id="${item.id}">
      <button class="dyn-pub__delete" type="button" data-id="${item.id}" data-title="${title}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <a class="dyn-pub__link" href="publication.html?id=${item.id}">
        <h2 class="dyn-pub__title">${title}</h2>
        <p class="dyn-pub__date">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M3 0h6l3 3v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5 1v3h3L8 1z"/></svg>
          <span>${date}</span>
        </p>
        ${desc ? `<p class="dyn-pub__desc">${desc}</p>` : ''}
      </a>
    </li>
  `;
}

let currentRole = 'citizen';
window.__currentRole = currentRole;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const token = await user.getIdTokenResult();
      currentRole = token.claims.role || 'citizen';
    } catch (e) {}
  } else {
    currentRole = 'citizen';
  }
  window.__currentRole = currentRole;
  updateDeleteBtns(currentRole);
});

function updateDeleteBtns(role) {
  const show = role === 'government';
  document.querySelectorAll('.dyn-pub__delete').forEach((btn) => {
    btn.classList.toggle('is-visible', show);
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      if (id) handleDelete(id, title);
    };
  });
}

async function handleDelete(docId, title) {
  if (!confirm('Удалить публикацию?\n\n«' + title + '»\n\nДействие необратимо.')) return;
  try {
    await deleteDoc(doc(db, 'publications', docId));
    const li = document.querySelector('.dyn-pub[data-doc-id="' + docId + '"]');
    if (li) li.remove();
  } catch (err) {
    alert('Ошибка удаления: ' + err.message);
  }
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' года';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}