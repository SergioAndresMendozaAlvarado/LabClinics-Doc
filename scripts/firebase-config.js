import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyDiIdBBI6YRavVhxAF5hyWXMb8tEnSUnAI',
  authDomain: 'labclinics-info.firebaseapp.com',
  projectId: 'labclinics-info',
  storageBucket: 'labclinics-info.firebasestorage.app',
  messagingSenderId: '176511208133',
  appId: '1:176511208133:web:2b170e767c8cbe8eaebeac',
  measurementId: 'G-6FFPTZGWCN',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const ensureFirebaseApp = () => firebaseApp;
