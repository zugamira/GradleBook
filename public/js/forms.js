// public/js/forms.js

import { auth, db } from './config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Элементы переключения
const tabLogin        = document.getElementById("tab-login");
const teacherLoginBtn = document.getElementById("teacher-login-btn");

// Контейнеры форм
const studentLoginForm = document.getElementById("student-login-form");
const teacherLoginForm = document.getElementById("teacher-login-form");

// Формы и блоки ошибок
const formLogin   = document.getElementById("login-form");
const errLogin    = document.getElementById("login-error");
const teacherForm = document.getElementById("teacher-login-form-actual");
const errTeacher  = document.getElementById("teacher-login-error");

// Переключение форм
tabLogin.onclick        = showStudentLogin;
teacherLoginBtn.onclick = showTeacherLogin;

function showStudentLogin() {
  tabLogin.classList.add("active");
  teacherLoginBtn.classList.remove("active");
  studentLoginForm.classList.remove("hidden");
  teacherLoginForm.classList.add("hidden");
}

function showTeacherLogin() {
  teacherLoginBtn.classList.add("active");
  tabLogin.classList.remove("active");
  studentLoginForm.classList.add("hidden");
  teacherLoginForm.classList.remove("hidden");
}

// — Вход студента через Email/Password —
formLogin.addEventListener("submit", async e => {
  e.preventDefault();
  errLogin.textContent = "";
  try {
    const identifier = document.getElementById("login-identifier").value.trim();
    const password   = document.getElementById("login-password").value;
    const email = identifier.includes('@')
      ? identifier
      : `${identifier}@gradlebook.local`;

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("role", "student");
    localStorage.setItem("uid", userCred.user.uid);
    window.location.href = "student-dashboard.html";
  } catch (err) {
    console.error(err);
    errLogin.textContent = err.message;
  }
});

// — Вход преподавателя через Email/Password —
teacherForm.addEventListener("submit", async e => {
  e.preventDefault();
  errTeacher.textContent = "";
  try {
    // Берём e-mail и пароль из формы
    const email    = document.getElementById("teacher-email").value.trim();
    const password = document.getElementById("teacher-password").value;

    // Авторизуемся через Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    // Проверяем, есть ли этот uid в коллекции admins
    const adminSnap = await getDoc(doc(db, "admins", uid));
    if (adminSnap.exists()) {
      localStorage.setItem("role", "admin");
      return window.location.href = "admin/index.html";
    }

    // Иначе проверяем в коллекции teachers
    const teacherSnap = await getDoc(doc(db, "teachers", uid));
    if (teacherSnap.exists()) {
      localStorage.setItem("role", "teacher");
      localStorage.setItem("teacherUid", uid);
      return window.location.href = "teacher-dashboard.html";
    }

    // Если ни там, ни там — ошибка
    throw new Error("Учётная запись не найдена");
  } catch (err) {
    console.error(err);
    errTeacher.textContent = err.message;
  }
});
;
