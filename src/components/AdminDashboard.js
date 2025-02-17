import React, { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const AdminDashboard = () => {
  const [recipientType, setRecipientType] = useState('all');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [dailyUserGrowth, setDailyUserGrowth] = useState([]);
  const [monthlyMessageCount, setMonthlyMessageCount] = useState([]);

  // Загрузка статистики
  useEffect(() => {
    // Загрузка общего количества пользователей
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/users/count/')
      .then(response => response.json())
      .then(data => {
        setUserCount(data.count || 0);
      })
      .catch(error => console.error('Ошибка загрузки количества пользователей: ', error));

    // Загрузка статистики пользователей за день
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/users/count-per-day/')
      .then(response => response.json())
      .then(data => {
        setDailyUserGrowth(data.dailyGrowth || []);
      })
      .catch(error => console.error('Ошибка загрузки статистики за день: ', error));

    // Здесь также можно загрузить статистику сообщений, если она доступна
    // Например, запрос на количество отправленных сообщений за месяц
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/messages/count-per-month/')
      .then(response => response.json())
      .then(data => {
        setMonthlyMessageCount(data.monthlyMessageCount || []);
      })
      .catch(error => console.error('Ошибка загрузки статистики сообщений: ', error));

  }, []);

  // Отправка сообщения
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message && (recipientType === 'all' || phoneNumber)) {
      fetch('/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: recipientType,
          value: phoneNumber,
          message: message
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Сообщение успешно отправлено');
          setMessage('');
          setPhoneNumber('');
        } else {
          alert('Ошибка отправки сообщения');
        }
      })
      .catch(error => console.error('Ошибка отправки сообщения: ', error));
    } else {
      alert('Пожалуйста, заполните все поля.');
    }
  };

  return (
    <div className="container">
      <div className="left-panel">
        <h2>Статистика telegram бота</h2>
        <div className="chart">
          <canvas id="userGrowthChart"></canvas>
        </div>
        <div className="chart">
          <canvas id="messageCountChart"></canvas>
        </div>
        <div className="statistic">
          <h3>Общая статистика</h3>
          <p>Количество пользователей: <span>{userCount}</span></p>
          <p>Готовы получать уведомления: <span>{subscriberCount}</span></p>
        </div>
      </div>
      <div className="right-panel">
        <h2>Отправка сообщений</h2>
        <form onSubmit={handleSendMessage} className="message-form">
          <label>Выберите способ отправки:</label>
          <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)}>
            <option value="all">Всем пользователям</option>
            <option value="phone">По номеру телефона</option>
          </select>
          {recipientType === 'phone' && (
            <input 
              type="text" 
              placeholder="+7 (XXX) XXX-XX-XX" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          )}
          <textarea 
            placeholder="Введите ваше сообщение..." 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <button type="submit">Отправить сообщение</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
