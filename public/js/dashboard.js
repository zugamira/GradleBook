import { auth, db } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
  doc, getDoc, 
  collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const userNameEl  = document.getElementById("user-name");
const userGroupEl = document.getElementById("user-group");
const logoutBtn   = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async user => {
  if (!user) {
    // Если не залогинен — обратно на index.html
    return window.location.href = "index.html";
  }

  // 2.1 Отрисуем ФИО и группу
  const studentSnap = await getDoc(doc(db, "students", user.uid));
  const { displayName, groupId, studentNumber } = studentSnap.data();
  document.getElementById("user-name").textContent  = displayName;
  document.getElementById("user-group").textContent = groupId;

  // 2.2 Запрос оценок: по studentNumber
  const gradesQ = query(
    collection(db, "grades"),
    where("studentNumber", "==", studentNumber)
  );
  const gradesSnap = await getDocs(gradesQ);

  const tbody = document.querySelector("#grades-table tbody");
  tbody.innerHTML = ""; // очистим на всякий случай

  gradesSnap.forEach(docSnap => {
    const { subject, type, grade, date } = docSnap.data();
    // приводим timestamp к читаемой дате
    const d = date.toDate().toLocaleDateString("ru-RU");
    // Вставляем строку
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${subject}</td>
      <td>${type}</td>
      <td>${grade}</td>
      <td>${d}</td>
    `;
    tbody.appendChild(tr);
  });
});


logoutBtn.onclick = () =>
  signOut(auth).then(() => window.location.href = "index.html");

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "index.html");
});
с