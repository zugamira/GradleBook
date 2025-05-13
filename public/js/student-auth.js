import { auth, db } from './config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const form = document.getElementById('login-form');
const err  = document.getElementById('login-error');

form.addEventListener('submit', async e => {
  e.preventDefault();
  err.textContent = '';
  let identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;

  let email;
  if (identifier.includes('@')) {
    // пользователь ввёл email
    email = identifier;
  } else {
    // пользователь ввёл studentNumber
    // ищем документ в students, чтобы убедиться, что есть такой студент
    const q = query(collection(db, 'students'), where('studentNumber','==', identifier));
    const snap = await getDocs(q);
    if (snap.empty) {
      err.textContent = 'Студент не найден';
      return;
    }
    const student = snap.docs[0].data();
    // собираем email по соглашению с пользхователем
    email = `${student.studentNumber}@gradlebook.local`;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'student-dashboard.html';
  } catch (error) {
+   console.error("Ошибка при входе студента:", error);
    err.textContent = error.message;
  }
});

// Если уже залогинен — сразу на дашборд
onAuthStateChanged(auth, user => {
  if (user) window.location.href = 'student-dashboard.html';
});
