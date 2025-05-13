// public/js/teacher-dashboard.js

import { db } from './config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  documentId
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  // 0) Получаем UID преподавателя, сохранённый после Auth
  const teacherUid = localStorage.getItem('teacherUid');
  if (!teacherUid) {
    return window.location.href = 'index.html';
  }

  // 1) DOM-узлы
  const groupSelect   = document.getElementById('group-select');
  const subjectSelect = document.getElementById('subject-select');
  const tbody1        = document.getElementById('grades-sem1');
  const tbody2        = document.getElementById('grades-sem2');

  // 2) Загружаем документ преподавателя
  const tSnap = await getDoc(doc(db, 'teachers', teacherUid));
  if (!tSnap.exists()) {
    alert('Преподаватель не найден в базе');
    return;
  }
  const groupIds = tSnap.data().groupIds || [];
  if (groupIds.length === 0) {
    groupSelect.innerHTML = '<option value="">Группы не назначены</option>';
    return;
  }

  // 3) Подгружаем группы
  const groupsQ    = query(
    collection(db, 'groups'),
    where(documentId(), 'in', groupIds)
  );
  const groupsSnap = await getDocs(groupsQ);
  groupsSnap.forEach(d => {
    const opt = document.createElement('option');
    opt.value       = d.id;
    opt.textContent = d.data().code;
    groupSelect.append(opt);
  });

  // 4) При смене группы — подгружаем дисциплины
  groupSelect.addEventListener('change', async () => {
    const gId = groupSelect.value;
    subjectSelect.innerHTML = '<option value="">— Выберите дисциплину —</option>';
    tbody1.innerHTML = tbody2.innerHTML = '';
    if (!gId) return;

    // Берём все дисциплины, где поле teacherIds содержит нашего UID
    const subsQ    = query(
      collection(db, 'subjects'),
      where('teacherIds', 'array-contains', teacherUid)
    );
    const subsSnap = await getDocs(subsQ);
    subsSnap.forEach(d => {
      const data = d.data();
      // Отфильтруем по выбранной группе
      if (Array.isArray(data.groupIds) && data.groupIds.includes(gId)) {
        const opt = document.createElement('option');
        opt.value       = d.id;
        opt.textContent = data.name.trim();
        subjectSelect.append(opt);
      }
    });
  });

  // 5) При смене дисциплины — отрисовываем таблицы и заполняем оценки
  subjectSelect.addEventListener('change', async () => {
    const gId = groupSelect.value;
    const sId = subjectSelect.value;
    tbody1.innerHTML = tbody2.innerHTML = '';
    if (!gId || !sId) return;

    // 5.1) Получаем студентов группы
    const stSnap = await getDocs(
      query(collection(db, 'students'), where('groupId', '==', gId))
    );
    const students = stSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    // 5.2) Функция отрисовки строк
    function renderSem(sem, tbody) {
      const types = ['exam','credit','diffCredit','interview','coursework','test','essay']
        .map(t => sem === 2 ? t + '2' : t);

      students.forEach(s => {
        const tr = document.createElement('tr');
        tr.dataset.student  = s.uid;
        tr.dataset.semester = sem;
        tr.innerHTML = `<td>${s.displayName}</td><td>${s.studentNumber}</td>`;
        types.forEach(type => {
          const td = document.createElement('td');
          td.classList.add('grade-cell');
          td.dataset.type = type;
          td.textContent = '—';
          td.addEventListener('click', onCellClick);
          tr.append(td);
        });
        tbody.append(tr);
      });
    }

    renderSem(1, tbody1);
    renderSem(2, tbody2);

    // 5.3) Подгружаем уже выставленные оценки
    const gradesSnap = await getDocs(
      query(collection(db, 'grades'), where('subjectId', '==', sId))
    );
    const allGrades = gradesSnap.docs.map(d => d.data());

    // 5.4) Заполняем ячейки
    document.querySelectorAll('td.grade-cell').forEach(td => {
      const uid  = td.parentElement.dataset.student;
      const sem  = +td.parentElement.dataset.semester;
      const type = td.dataset.type;
      const found = allGrades.find(g =>
        g.studentUid === uid &&
        g.semester   === sem &&
        g.type       === type
      );
      if (found) td.textContent = found.gradeValue;
    });
  });

  // 6) Обработчик клика — ввод и запись оценки
  async function onCellClick(e) {
    const td         = e.currentTarget;
    const tr         = td.parentElement;
    const studentUid = tr.dataset.student;
    const semester   = +tr.dataset.semester;
    const type       = td.dataset.type;
    const subjectId  = subjectSelect.value;
    const gradeValue = prompt('Введите оценку (зачтено/не зачтено или 1–10):');
    if (!gradeValue) return;

    try {
      await addDoc(collection(db, 'grades'), {
        studentUid,
        subjectId,
        semester,
        type,
        gradeValue,
        teacherUid,
        date: serverTimestamp()
      });
      td.textContent = gradeValue;
    } catch (err) {
      console.error(err);
      alert('Ошибка доступа или записи: ' + err.message);
    }
  }
});
