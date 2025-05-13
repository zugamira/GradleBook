import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjM5koYX_8tZfZI70NlaSWY0naeVk4nEY",
  authDomain: "gradlebookdb.firebaseapp.com",
  projectId: "gradlebookdb",
  storageBucket: "gradlebookdb.appspot.com",
  messagingSenderId: "1000800185484",
  appId: "1:1000800185484:web:136b2efebffdfd9b6d9fa9"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
