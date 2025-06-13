import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, fetchWithAuth } from "./auth";
import "./Events.css";

const EVENTS_API_URL = "http://192.168.16.222:7002/api/v1";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    name_event: "",
    description: "",
    date: "",
    time: "",
    location: "",
    limit_people: "",
    points_for_the_event: ""
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventsPerPage = 9;
  const [error, setError] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

 const fetchEvents = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetchWithAuth(
      `${EVENTS_API_URL}/events/get/?is_paginated=true&page=${currentPage}&limit=${eventsPerPage}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    // Проверка структуры данных
    if (data && data.event && Array.isArray(data.event)) {
      setEvents(data.event);
      setTotalPages(data.total_pages || 1);
    } else {
      throw new Error("Неверная структура данных в ответе");
    }
  } catch (err) {
    console.error("Ошибка загрузки мероприятий:", err);
    setError(err.message || "Неизвестная ошибка при загрузке мероприятий");
    setEvents([]);
  } finally {
    setLoading(false);
  }
}, [currentPage, eventsPerPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const addEvent = async () => {
    const requiredFields = ['name_event', 'description', 'date', 'time', 'location'];
    const missingFields = requiredFields.filter(field => !newEvent[field].trim());

    if (missingFields.length > 0) {
      alert(`Заполните обязательные поля: ${missingFields.join(', ')}`);
      return;
    }

    const localDateTime = new Date(`${newEvent.date}T${newEvent.time}`);
    const isoDateTime = localDateTime.toISOString();

    try {
      const response = await fetchWithAuth(`${EVENTS_API_URL}/events/add/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: newEvent.name_event.trim(),
          date_time: isoDateTime,
          location: newEvent.location.trim(),
          description: newEvent.description.trim(),
          limit_people: newEvent.limit_people ? Number(newEvent.limit_people) : null,
          points_for_the_event: newEvent.points_for_the_event ? Number(newEvent.points_for_the_event) : null
        })
      });

      // Проверка типа контента перед попыткой распарсить JSON
      let result = null;
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      }

      if (!response.ok) {
        const errorMsg = result || `Ошибка ${response.status}`;
        throw new Error(errorMsg);
      }

      await fetchEvents();
      setNewEvent({
        name_event: "",
        description: "",
        date: "",
        time: "",
        location: "",
        limit_people: "",
        points_for_the_event: ""
      });
      setModalOpen(false);
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err.message || "Ошибка при добавлении мероприятия");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Вы уверены, что хотите удалить это мероприятие?")) return;

    try {
      const response = await fetchWithAuth(`${EVENTS_API_URL}/events/delete/${eventId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении");
      }

      if (events.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await fetchEvents();
      }
    } catch (err) {
      console.error("Ошибка:", err);
      alert(err.message);
    }
  };

  const toggleDescription = (eventId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="events-container">
      <h1>Мероприятия</h1>
      <button className="add-event-button" onClick={() => setModalOpen(true)}>
        Добавить мероприятие
      </button>

      {/* Модальное окно */}
      {modalOpen && (
        <div className={`modal ${modalOpen ? "open" : ""}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить мероприятие</h2>
              <button className="close-button" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="label-left">Название мероприятия</label>
              <input type="text" name="name_event" value={newEvent.name_event} onChange={handleInputChange} required />
              <label className="label-left">Описание</label>
              <textarea name="description" value={newEvent.description} onChange={handleInputChange} required />
              <label className="label-left">Дата</label>
              <input type="date" name="date" value={newEvent.date} onChange={handleInputChange} required />
              <label className="label-left">Время</label>
              <input type="time" name="time" value={newEvent.time} onChange={handleInputChange} required />
              <label className="label-left">Место проведения</label>
              <input type="text" name="location" value={newEvent.location} onChange={handleInputChange} required />
              <label className="label-left">Лимит участников (необязательно)</label>
              <input type="number" name="limit_people" value={newEvent.limit_people} onChange={handleInputChange} />
              <label className="label-left">Очки за мероприятие (необязательно)</label>
              <input type="number" name="points_for_the_event" value={newEvent.points_for_the_event} onChange={handleInputChange} />
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setModalOpen(false)}>Отмена</button>
              <button className="save-button" onClick={addEvent}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}

      {error && (
        <div className="error-message">
          Ошибка: {error} <button onClick={fetchEvents}>Повторить</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="events-grid">
            {events.length > 0 ? (
              events.map(event => (
                <div key={event.id} className="event-card">
                  <h3>{event.name_event}</h3>
                  <p><strong>Дата и время:</strong> {new Date(event.date_time).toLocaleString()}</p>
                  <p><strong>Место:</strong> {event.location || "Не указано"}</p>

                  <button className="description-toggle" onClick={() => toggleDescription(event.id)}>
                    {expandedDescriptions[event.id] ? "Скрыть описание" : "Показать описание"}
                  </button>

                  <div className={`event-description-container ${expandedDescriptions[event.id] ? 'expanded' : ''}`}>
                    <p className="event-description"><strong>Описание:</strong> {event.description || "Не указано"}</p>
                  </div>

                  <p><strong>Лимит участников:</strong> {event.limit_people || "Не указано"}</p>
                  <p><strong>Очки за мероприятие:</strong> {event.points_for_the_event || "Не указано"}</p>

                  <button className="delete-button" onClick={() => deleteEvent(event.id)}>
                    Удалить
                  </button>
                </div>
              ))
            ) : (
              <div className="no-events">Мероприятий не найдено</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Назад</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={currentPage === pageNum ? "active" : ""}
                >
                  {pageNum}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Вперед</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;