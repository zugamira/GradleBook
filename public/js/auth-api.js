// public/js/auth-api.js
import { db } from './config.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/**
 * Логин студента по ФИО и паролю, без Firebase Auth
 */
export async function loginStudent({ identifier, password }) {
  // identifier — ФИО
  const q = query(
    collection(db, 'students'),
    where('displayName', '==', identifier),
    where('password', '==', password)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('Неверное ФИО или пароль');
  }
  // Сохраняем в localStorage ID документа и ФИО
  const doc = snap.docs[0];
  localStorage.setItem('studentUid', doc.id);
  localStorage.setItem('studentName', doc.data().displayName);
  return true;
}
