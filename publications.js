// js/publications.js
// Подгружает публикации из Firestore + удаление для роли government

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const SECTION_MAP = {
  'ukazy':          'ukazy',
  'ap':             'ap',
  'postanovleniya': 'postanovleniya',
  'zak-sobranie':   'zak-sobranie',
  'cik':            'cik',
  'sb':             'sb'
};

const fileName = window.location.pathname.split('/').pop().replace(/\.html$/, '');
const section = SECTION_MAP[fileName];

let currentRole = 'citizen';

if (section) {
  injectStyles();
  initAuthAndLoad(section);
}

// Ждём, пока Firebase Auth отдаст роль, потом грузим
function initAuthAndLoad(section) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdTokenResult();
        currentRole = token.claims.role || 'citizen';
      } catch (e) {}
    } else {
      currentRole = 'citizen';
    }

    const ul = document.querySelector('.ukazy-list, .post-list, .zs-list, .cik-list, .sb-list');
    if (!ul) return;
    loadPublications(section, ul);
  });
}

function injectStyles() {
  if (document.getElementById('dyn-pub-styles')) return;
  const style = document.createElement('style');
  style.id = 'dyn-pub-styles';
  style.textContent = `
    .dyn-pub {
      padding: 24px 0;
      border-bottom: 1px solid #e8e8e8;
      position: relative;
    }
    .dyn-pub:first-child { padding-top: 0; }
    .dyn-pub:last-child { border-bottom: none; padding-bottom: 0; }
    .dyn-pub__title {
      font-size: 22px; font-weight: 700; color: #111;
      margin: 0 0 10px; line-height: 1.3;
      letter-spacing: 0.01em; text-transform: uppercase;
      padding-right: 44px;
    }
    .dyn-pub__meta {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 15px; color: #666; margin: 0 0 12px; line-height: 1.4;
    }
    .dyn-pub__meta svg { color: #c9a24a; flex-shrink: 0; }
    .dyn-pub__img-link {
      display: block; border: 1px solid #e8e8e8;
      border-radius: 8px; overflow: hidden;
      transition: opacity 0.2s ease;
    }
    .dyn-pub__img-link:hover { opacity: 0.9; }
    .dyn-pub__img { display: block; width: 100%; height: auto; }

    /* Кнопка удаления */
    .dyn-pub__delete {
      position: absolute;
      top: 24px;
      right: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fff;
      border: 1px solid #e0b5b3;
      color: #c9302c;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, transform 0.15s ease;
      padding: 0;
      font-family: inherit;
      z-index: 2;
    }
    .dyn-pub__delete:hover {
      background: #c9302c;
      color: #fff;
      transform: scale(1.06);
    }
    .dyn-pub.is-deleting {
      opacity: 0.4;
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .dyn-pub { padding: 18px 0; }
      .dyn-pub__title { font-size: 17px; padding-right: 38px; }
      .dyn-pub__meta { font-size: 14px; }
      .dyn-pub__delete { top: 18px; width: 28px; height: 28px; }
    }
  `;
  document.head.appendChild(style);
}

async function loadPublications(section, ul) {
  try {
    const q = query(collection(db, 'publications'), where('section', '==', section));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const items = [];
    snap.forEach((d) => items.push({ id: d.id, data: d.data() }));

    items.sort((a, b) => {
      const ta = a.data.createdAt && a.data.createdAt.toMillis ? a.data.createdAt.toMillis() : 0;
      const tb = b.data.createdAt && b.data.createdAt.toMillis ? b.data.createdAt.toMillis() : 0;
      return tb - ta;
    });

    const html = items.map(renderItem).join('');
    ul.insertAdjacentHTML('beforeend', html);

    // Обработчики удаления
    ul.querySelectorAll('.dyn-pub__delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const docId = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title') || 'эту публикацию';
        if (docId) handleDelete(docId, title);
      });
    });
  } catch (err) {
    console.warn('Публикации не загружены:', err);
  }
}

function renderItem(item) {
  const d = item.data;
  const date = formatDate(d.createdAt);
  const author = d.author ? ' · ' + esc(d.author) : '';
  const title = esc(d.title || 'Без названия');
  const url = esc(d.imageUrl || '');

  // Кнопку удаления показываем только Правительству
  const deleteBtn = currentRole === 'government'
    ? `<button class="dyn-pub__delete" type="button" data-id="${item.id}" data-title="${title}" title="Удалить публикацию" aria-label="Удалить">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>`
    : '';

  return `
    <li class="dyn-pub" data-doc-id="${item.id}">
      ${deleteBtn}
      <h2 class="dyn-pub__title">${title}</h2>
      <p class="dyn-pub__meta">
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true">
          <path d="M3 0h6l3 3v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5 1v3h3L8 1z"/>
        </svg>
        <span>${date}${author}</span>
      </p>
      <a class="dyn-pub__img-link" href="${url}" target="_blank" rel="noopener">
        <img class="dyn-pub__img" src="${url}" alt="${title}" loading="lazy">
      </a>
    </li>
  `;
}

async function handleDelete(docId, title) {
  const ok = window.confirm('Удалить публикацию?\n\n«' + stripHtml(title) + '»\n\nДействие необратимо.');
  if (!ok) return;

  const li = document.querySelector('.dyn-pub[data-doc-id="' + docId + '"]');
  if (li) li.classList.add('is-deleting');

  try {
    await deleteDoc(doc(db, 'publications', docId));
    if (li) li.remove();
  } catch (err) {
    console.error('Удаление не удалось:', err);
    alert('Не удалось удалить: ' + (err.message || err.code));
    if (li) li.classList.remove('is-deleting');
  }
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' года';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function stripHtml(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div.textContent || div.innerText || '';
}