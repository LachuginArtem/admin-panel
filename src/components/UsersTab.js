import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './UsersTab.css';
Chart.register(...registerables);

const UsersTab = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [dailyMessageStats, setDailyMessageStats] = useState({ labels: [], counts: [] });
  const [userId, setUserId] = useState('');
  const [userMessages, setUserMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const chartRef = useRef(null);
  const limit = 3; 


  useEffect(() => {
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/subscribers/')
      .then((response) => response.json())
      .then((data) => {
        setSubscribers(data.contacts);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке данных:', error);
        setLoading(false);
      });
  }, []);


  useEffect(() => {
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/messages/count/')
      .then((response) => response.json())
      .then((data) => {
        setMessageCount(data.count || 0);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке количества сообщений:', error);
      });
  }, []);

 
  useEffect(() => {
    fetch('https://tyuiu-rag-bot-production.up.railway.app/api/v1/messages/count-per-day/')
      .then((response) => response.json())
      .then((data) => {
        const stats = data.count_per_day || {};
        const labels = Object.keys(stats);
        const counts = Object.values(stats);
        setDailyMessageStats({ labels, counts });
      })
      .catch((error) => {
        console.error('Ошибка при загрузке статистики сообщений:', error);
      });
  }, []);

  
  useEffect(() => {
    const ctx = document.getElementById('messagesChart').getContext('2d');
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dailyMessageStats.labels,
        datasets: [
          {
            label: 'Сообщений за день',
            data: dailyMessageStats.counts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Дата',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Количество сообщений',
            },
          },
        },
      },
    });
  }, [dailyMessageStats]);


  const fetchUserMessages = (page = 1) => {
    setLoadingMessages(true);

    fetch(`https://tyuiu-rag-bot-production.up.railway.app/api/v1/messages/${userId}/?page=${page}&limit=${limit}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ошибка сети');
        }
        return response.json();
      })
      .then((data) => {
        setUserMessages(data.messages || []);
        setCurrentPage(data.page || 1);

        const totalMessages = data.total || data.messages.length;
        const calculatedTotalPages = Math.ceil(totalMessages / limit);
        setTotalPages(calculatedTotalPages);

        setLoadingMessages(false);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке сообщений пользователя:', error);
        setLoadingMessages(false);
      });
  };


  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchUserMessages(prevPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchUserMessages(nextPage);
    }
  };

 
  const toggleHistoryVisibility = () => {
    setIsHistoryVisible(!isHistoryVisible);
  };


  const selectUser = (id) => {
    setUserId(id);
    setIsHistoryVisible(true);
  };

  return (
    <div className="users-container">
      <div className="left-panel">
        <h1>Статистика сообщений</h1>
        <div className="message-count-card">
          <h2>Количество сообщений:</h2>
          <p>{messageCount}</p>
        </div>
        <div className="chart-container">
          <h2>Сообщения за дни</h2>
          <canvas id="messagesChart"></canvas>
        </div>
      </div>

      <div className="center-panel">
        <h1>Подписчики</h1>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <table className="subscribers-table">
            <thead>
              <tr>
                <th>ID пользователя</th>
                <th>Телефон</th>
                <th>Дата добавления</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.user_id} onClick={() => selectUser(subscriber.user_id)}>
                  <td>{subscriber.user_id}</td>
                  <td>{subscriber.phone_number}</td>
                  <td>{new Date(subscriber.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="right-panel">
        <h1>История сообщений</h1>
        <button onClick={toggleHistoryVisibility} className="toggle-history-button">
          {isHistoryVisible ? 'Скрыть историю' : 'Показать историю'}
        </button>

        {isHistoryVisible && (
          <>
            <input
              type="text"
              placeholder="Введите ID пользователя"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="input-field"
              />
              <button onClick={() => fetchUserMessages(1)} className="fetch-button">
                Показать сообщения
              </button>
  
              {loadingMessages ? (
                <p>Загрузка сообщений...</p>
              ) : (
                <div className="message-history">
                  {userMessages.length > 0 ? (
                    userMessages.map((message, index) => (
                      <div key={index} className="message-card">
                        <p><strong>ID пользователя:</strong> {message.user_id}</p>
                        <p><strong>Сообщение пользователя:</strong> {message.user_message}</p>
                        <p><strong>Ответ бота:</strong> {message.bot_message}</p>
                        <p><strong>Дата:</strong> {new Date(message.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p>Сообщений нет.</p>
                  )}
                </div>
              )}
  
              <div className="pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 1}>Назад</button>
                <span>Страница {currentPage} из {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages}>Вперед</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  export default UsersTab;