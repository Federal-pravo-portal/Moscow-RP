// js/publications.js
// Подгружает публикации из Firestore в существующий <ul> на странице раздела

import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

if (section) init(section);

function init(section) {
  const ul = document.querySelector('.ukazy-list, .post-list, .zs-list, .cik-list, .sb-list');
  if (!ul) return;
  injectStyles();
  loadPublications(section, ul);
}

function injectStyles() {
  if (document.getElementById('dyn-pub-styles')) return;
  const style = document.createElement('style');
  style.id = 'dyn-pub-styles';
  style.textContent = `
    .dyn-pub { padding: 24px 0; border-bottom: 1px solid #e8e8e8; }
    .dyn-pub:first-child { padding-top: 0; }
    .dyn-pub:last-child { border-bottom: none; padding-bottom: 0; }
    .dyn-pub__title {
      font-size: 22px; font-weight: 700; color: #111;
      margin: 0 0 10px; line-height: 1.3;
      letter-spacing: 0.01em; text-transform: uppercase;
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
    @media (max-width: 640px) {
      .dyn-pub { padding: 18px 0; }
      .dyn-pub__title { font-size: 17px; }
      .dyn-pub__meta { font-size: 14px; }
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
    snap.forEach((doc) => items.push(doc.data()));

    items.sort((a, b) => {
      const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    const html = items.map(renderItem).join('');
    ul.insertAdjacentHTML('beforeend', html);
  } catch (err) {
    console.warn('Публикации не загружены:', err);
  }
}

function renderItem(item) {
  const date = formatDate(item.createdAt);
  const author = item.author ? ' · ' + esc(item.author) : '';
  const title = esc(item.title || 'Без названия');
  const url = esc(item.imageUrl || '');

  return `
    <li class="dyn-pub">
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