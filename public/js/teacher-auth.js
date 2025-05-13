document.getElementById('teacher-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('teacher-name').value.trim();
    const password = document.getElementById('teacher-password').value;
  
    try {
      const teacherRef = firebase.firestore().collection('teachers');
      const snapshot = await teacherRef.where('name', '==', name).limit(1).get();
  
      if (snapshot.empty) {
        alert('Преподаватель не найден');
        return;
      }
  
      const teacher = snapshot.docs[0].data();
  
      // Предполагается, что пароли хранятся в виде хэшей; здесь упрощённая проверка
      if (teacher.password !== password) {
        alert('Неверный пароль');
        return;
      }
  
      // Сохраняем информацию о преподавателе в localStorage
      localStorage.setItem('teacherId', snapshot.docs[0].id);
      window.location.href = 'teacher-dashboard.html';
    } catch (error) {
      console.error('Ошибка при входе:', error);
      alert('Произошла ошибка при входе');
    }
  });
  