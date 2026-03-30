firebase.js
// 🔥 IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


// 🔥 YOUR REAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBp7WnJsnKC7MvYygSn9xgUA627CsZS0Yc",
  authDomain: "my-shopping-site-f801f.firebaseapp.com",
  projectId: "my-shopping-site-f801f",
  storageBucket: "my-shopping-site-f801f.firebasestorage.app",
  messagingSenderId: "818044215511",
  appId: "1:818044215511:web:108425d16b36a4e9ab1092"
};


// 🚀 INITIALIZE
const app = initializeApp(firebaseConfig);

// 🔐 SERVICES
const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 ADMIN CHECK
const ADMIN_EMAIL = "swatantragupta06@gmail.com";

function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

// 📦 EXPORT EVERYTHING
export {
  auth,
  db,
  isAdmin,

  // Auth
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

  // Firestore
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
};
