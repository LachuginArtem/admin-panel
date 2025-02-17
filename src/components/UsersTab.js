import React, { useEffect, useState } from 'react';

const UsersTab = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Выполняем запрос к API для получения подписчиков
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/subscribers/')
      .then((response) => response.json())
      .then((data) => {
        setSubscribers(data.contacts); // Устанавливаем полученные данные
        setLoading(false);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке данных:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Пользователи</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <ul>
          {subscribers.map((subscriber) => (
            <li key={subscriber.user_id}>
              <p>Телефон: {subscriber.phone_number}</p>
              <p>Дата добавления: {new Date(subscriber.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UsersTab;
