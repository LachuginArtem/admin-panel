import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, fetchWithAuth } from "./auth";
import "./UnifiedDashboard.css";

const BOT_API_URL = process.env.REACT_APP_BOT_API_URL || "https://your-api-base-url";
const NOTIFY_API_URL = process.env.REACT_APP_NOTIFY_API_URL || "https://your-notify-base-url";

const UnifiedDashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipientType, setRecipientType] = useState("all");
  // Удаляем bot_token, если он не нужен
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const limit = 10;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BOT_API_URL}/api/v1/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      let filteredSubscribers = data || [];
      if (statusFilter !== "all") {
        filteredSubscribers = filteredSubscribers.filter(
          (sub) => sub.status === statusFilter
        );
      }
      setSubscribers(filteredSubscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const fetchNotifications = useCallback(async (page = 1) => {
    if (!userId) return;

    setLoadingNotifications(true);
    try {
      const response = await fetchWithAuth(
        `${BOT_API_URL}/api/v1/users/${userId}/notifications?page=${page}&limit=${limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setNotifications(data);
        setCurrentPage(page);
        const totalNotifications = data.length || 0; // Adjust based on API response
        setTotalPages(Math.ceil(totalNotifications / limit));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message || (recipientType === "phone" && !phoneNumber)) {
      alert("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    const payload = {
      level: "INFO", // Default level, can be configurable
      user_id: recipientType === "phone" ? undefined : userId,
      text: message,
      photo: "", // Optional, can be added via input
    };

    try {
      const response = await fetchWithAuth(`${NOTIFY_API_URL}/api/v1/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ошибка отправки уведомления");
      }
      const data = await response.json();
      alert("Уведомление успешно отправлено");
      setMessage("");
      setPhoneNumber("");
    } catch (error) {
      console.error("Error sending notification:", error);
      alert(error.message || "Что-то пошло не так. Попробуйте позже.");
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) fetchNotifications(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) fetchNotifications(currentPage + 1);
  };

  const selectUser = (id) => {
    setUserId(id);
    setCurrentPage(1);
    setTotalPages(1);
    setNotifications([]);
    fetchNotifications(1);
  };

  return (
    <div className="dashboard-container">
      <div className="center-panel">
        <h2>Абитуриенты</h2>
        <div className="filter-container">
          <label htmlFor="statusFilter">Фильтр по статусу: </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Все</option>
            <option value="READY">Готовы к уведомлениям</option>
            <option value="REGISTRATION_REQUIRE">Требуется регистрация</option>
          </select>
        </div>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <table className="subscribers-table">
            <thead>
              <tr>
                <th>ID пользователя</th>
                <th>Телефон</th>
                <th>Статус</th>
                <th>Дата добавления</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.user_id} onClick={() => selectUser(subscriber.user_id)}>
                  <td>{subscriber.user_id}</td>
                  <td>{subscriber.phone_number}</td>
                  <td className={`status-${subscriber.status.toLowerCase().replace("_", "-")}`}>
                    {subscriber.status}
                  </td>
                  <td>{new Date(subscriber.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="right-panel">
        <h2>Отправка уведомлений абитуриентам</h2>
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="recipient-select">
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              className="recipient-dropdown"
            >
              <option value="all">Всем абитуриентам</option>
              <option value="phone">По номеру телефона</option>
            </select>
          </div>

          {recipientType === "phone" && (
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="+7(XXX)XXX-XX-XX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <textarea
              className="message-input"
              placeholder="Введите уведомление для абитуриентов..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="send-button">
            Отправить
          </button>
        </form>

        <h2>История уведомлений</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Введите ID абитуриента"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field"
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              setTotalPages(1);
              setNotifications([]);
              fetchNotifications(1);
            }}
            className="fetch-button"
          >
            Показать уведомления
          </button>
        </div>

        {loadingNotifications ? (
          <p>Загрузка уведомлений...</p>
        ) : (
          <div className="message-history">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={index} className="message-card">
                  <p><strong>Уровень:</strong> {notification.level}</p>
                  <p><strong>Текст:</strong> {notification.text}</p>
                  <p><strong>Статус:</strong> {notification.status}</p>
                  <p><strong>Дата:</strong> {new Date(notification.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>Уведомлений нет.</p>
            )}
          </div>
        )}

        <div className="pagination">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Назад
          </button>
          <span className="pagination-info">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Вперед
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;