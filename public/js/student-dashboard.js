import { db } from './config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  // 1) Проверяем, что студент аутентифицирован
  const studentUid = localStorage.getItem('uid');
  if (!studentUid) {
    return window.location.href = 'index.html';
  }

  // 2) Загружаем профиль студента
  const studentRef  = doc(db, 'students', studentUid);
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) {
    alert('Профиль студента не найден');
    return window.location.href = 'index.html';
  }
  const { displayName, groupId } = studentSnap.data();
  document.getElementById('student-name').textContent = displayName;

  // 3) Подгружаем дисциплины этой группы
  const subsSnap = await getDocs(
    query(collection(db, 'subjects'), where('groupIds', 'array-contains', groupId))
  );
  const subjects = subsSnap.docs.map(d => ({
    id:   d.id,
    ...d.data()
  }));

  // 4) Подгружаем все оценки этого студента
  const gradesSnap = await getDocs(
    query(collection(db, 'grades'), where('studentUid', '==', studentUid))
  );
  const allGrades = gradesSnap.docs.map(d => d.data());

  // 5) Функция рендера таблицы по семестру
  function renderSem(sem, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    // Типы аттестаций; для 2 семестра добавляем '2' к ключу
    const types = ['credit','exam','diffCredit','interview','coursework','test','essay']
      .map(t => sem === 2 ? t + '2' : t);

    // Фильтруем дисциплины по полю semester
    const semSubjects = subjects.filter(s => {
      // Если в документе subject есть поле semester
      return s.semester == sem || (typeof s.semester === 'string' && +s.semester === sem);
    });

    semSubjects.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.name.trim()}</td>`;
      types.forEach(type => {
        // Ищем оценку именно этого типа
        const found = allGrades.find(g =>
          g.subjectId === s.id &&
          g.semester  === sem &&
          g.type      === type
        );
        const td = document.createElement('td');
        td.textContent = found ? found.gradeValue : '—';
        tr.append(td);
      });
      tbody.append(tr);
    });
  }

  // Рендерим обе таблицы
  renderSem(1, 'grades-sem1');
  renderSem(2, 'grades-sem2');

  // 6) Выход
  document.getElementById('logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });
});
