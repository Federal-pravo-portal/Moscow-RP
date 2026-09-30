// js/firebase-config.js
// Инициализация Firebase — общий модуль для всех страниц

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJ9zPK0OzS9ujJ5xdeeOC_-4Q_i8L5PFE",
  authDomain: "moscow-rp-570af.firebaseapp.com",
  projectId: "moscow-rp-570af",
  storageBucket: "moscow-rp-570af.firebasestorage.app",
  messagingSenderId: "524784603894",
  appId: "1:524784603894:web:7e1a16afc6872fb19c52d7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);