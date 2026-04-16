export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDlHVttSl9_kpg0oSnb2H06GmO1tFUXlEk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "keymaster-pro-182e7.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "keymaster-pro-182e7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "keymaster-pro-182e7.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "39167657749",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:39167657749:web:05b4fb1812d073edcfcb1c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SGVNQLJ1T3",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://keymaster-pro-182e7-default-rtdb.firebaseio.com"
};
