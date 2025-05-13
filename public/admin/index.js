// public/admin/index.js

import { auth, db } from '../js/config.js';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Helper: показываем ошибку и редиректим
function denyAccess() {
  alert('У вас нет прав администратора или вы не залогинены.');
  auth.signOut().finally(() => window.location.href = '../index.html');
}

// Ждём и проверяем Auth + admin-документ
auth.onAuthStateChanged(async user => {
  if (!user) {
    return denyAccess();
  }

  // Проверим, что в коллекции admins есть документ с этим UID
  const adminSnap = await getDoc(doc(db, 'admins', user.uid));
  if (!adminSnap.exists()) {
    return denyAccess();
  }

  // Теперь — всё остальное, только для валидного админа:

  // 1) Одиночное добавление студента
  document.getElementById('single-student-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('adm-name').value.trim();
    const num   = document.getElementById('adm-number').value.trim();
    const grp   = document.getElementById('adm-group').value.trim();
    const pass  = document.getElementById('adm-pass').value.trim();
    const resEl = document.getElementById('single-result');
    resEl.textContent = 'Загрузка...';

    try {
      // 1.1) Создаём Auth-пользователя
      const email = `${num}@gradlebook.local`;
      const cred  = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });

      // 1.2) Сохраняем в Firestore
      const studentRef = doc(db, 'students', cred.user.uid);
      await setDoc(studentRef, {
        displayName:   name,
        studentNumber: num,
        groupId:       grp,
        password:      pass
      });

      resEl.textContent = `Студент создан: ${name}`;
    } catch (err) {
      console.error(err);
      resEl.textContent = `Ошибка: ${err.message}`;
    }
  });

  // 2) Массовая загрузка через CSV
  document.getElementById('bulk-upload-btn').addEventListener('click', () => {
    const file = document.getElementById('csv-file').files[0];
    if (!file) {
      alert('Выберите файл');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const text    = reader.result;
      const lines   = text.split('\n').map(l => l.trim()).filter(l => l);
      const headers = lines.shift().split(',').map(h => h.trim());
      const resEl   = document.getElementById('bulk-result');
      resEl.textContent = 'Загрузка...';

      let createdCount = 0;
      for (const line of lines) {
        const cols = line.split(',').map(c => c.trim());
        const s = {};
        headers.forEach((h, i) => s[h] = cols[i] || '');

        if (s.displayName && s.studentNumber && s.groupId && s.password) {
          try {
            const email = `${s.studentNumber}@gradlebook.local`;
            const cred  = await createUserWithEmailAndPassword(auth, email, s.password);
            await updateProfile(cred.user, { displayName: s.displayName });

            const studentRef = doc(db, 'students', cred.user.uid);
            await setDoc(studentRef, {
              displayName:   s.displayName,
              studentNumber: s.studentNumber,
              groupId:       s.groupId,
              password:      s.password
            });
            createdCount++;
          } catch (err) {
            console.error('Ошибка при создании студента:', err);
          }
        }
      }

      resEl.textContent = `Создано студентов: ${createdCount}`;
    };

    reader.onerror = err => {
      console.error('Ошибка чтения файла:', err);
      document.getElementById('bulk-result').textContent = `Ошибка чтения файла: ${err.message}`;
    };

    reader.readAsText(file, 'UTF-8');
  });

  // 3) Выход
  document.getElementById('admin-logout').addEventListener('click', () => {
    auth.signOut().then(() => window.location.href = '../index.html');
  });
});
