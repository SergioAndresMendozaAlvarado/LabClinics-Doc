import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

import { firebaseApp } from './firebase-config.js';

export const firebaseAuth = getAuth(firebaseApp);

setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
  // Ignorar errores de persistencia (modo incógnito u otros bloqueos).
});

export const loginWithEmail = (email, password) => signInWithEmailAndPassword(firebaseAuth, email, password);

export const logout = () => signOut(firebaseAuth);

export const watchAuth = (callback) => onAuthStateChanged(firebaseAuth, callback);

export const getCurrentUser = () => firebaseAuth.currentUser;
