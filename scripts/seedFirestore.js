// scripts/seedFirestore.js

// 1) Инициализация Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gradlebookdb.firebaseio.com"
});

const db = admin.firestore();

// 2) Функция для заливки данных
async function seed() {
  try {
    // --- 2.1: группы ---
    const groupsData = [
      {
        code: "920ПДДО-3-24",
        specialtyCode: "9-09-0114-13",
        specialtyName: "Педагогическая деятельность специалистов",
        qualificationCode: "920ПД",
        formOfStudy: "ДО",
        groupNumber: 3,
        year: 2024
      },
      {
        code: "909-2-24в",
        specialtyCode: "9-09-0114-19",
        specialtyName: "Менеджмент учреждений профессионального образования",
        qualificationCode: "909",
        formOfStudy: "в",
        groupNumber: 2,
        year: 2024
      }

    ];

    const groupRefs = [];
    for (const g of groupsData) {
      const ref = await db.collection('groups').add(g);
      groupRefs.push(ref.id);
    }

    // --- 2.2: преподаватели ---
    // Сразу создаём одного тестового преподавателя
    const teacherData = {
      displayName: "Петров Петр Петрович",
      email: "petrov@univ.ru",
      subjects: ["Математика", "Программирование"],
      groupIds: groupRefs  // привязываем этого преподавателя ко всем созданным группам
    };
    const teacherRef = await db.collection('teachers').add(teacherData);
    console.log(`Преподаватель ${teacherData.displayName} добавлен с ID: ${teacherRef.id}`);

    const studentRefs = []; // будет массив объектов {uid, studentNumber}

    // … код создания студентов:
    for (const s of studentsData) {
      const userAuth = await admin.auth().createUser({
        email: `${s.studentNumber}@gradlebook.local`,
        password: "student123",
        displayName: s.displayName
      });
      studentRefs.push({ uid: userAuth.uid, studentNumber: s.studentNumber });
      await db.collection('students').doc(userAuth.uid).set({
        displayName: s.displayName,
        groupId: s.groupId,
        studentNumber: s.studentNumber,
        uid: userAuth.uid
      });
    }
    
    const gradesData = [
      {
        studentNumber: "ZCH123456",
        subject: "Математика",
        type: "exam",
        grade: 5,
        date: admin.firestore.Timestamp.fromDate(new Date("2025-05-10"))
      },
      {
        studentNumber: "ZCH123456",
        subject: "Программирование",
        type: "credit",
        grade: "Зачтено",
        date: admin.firestore.Timestamp.fromDate(new Date("2025-04-20"))
      },
      {
        studentNumber: "ZCH123457",
        subject: "Математика",
        type: "exam",
        grade: 4,
        date: admin.firestore.Timestamp.fromDate(new Date("2025-05-10"))
      }
    ];
    
    for (const g of gradesData) {
      // находим у кого этот studentNumber
      const student = studentRefs.find(s => s.studentNumber === g.studentNumber);
      if (!student) continue;
      await db.collection('grades').add({
        ...g,
        studentUid: student.uid,
        teacherId 
      });
      console.log(`Добавлена оценка для ${g.studentNumber}`);
    }

    console.log("✅ Заливка всех данных завершена");
    process.exit(0);
  } catch (err) {
    console.error("❌ Ошибка при заливке данных:", err);
    process.exit(1);
  }
}

seed();
