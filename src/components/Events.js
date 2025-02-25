import React, { useState, useEffect } from "react";
import "./Events.css";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ name_event: "", description: "", date: "", time: "", location: "", limit_people: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://events-fastapi.onrender.com/events/v1/get/");
      if (!response.ok) throw new Error("Ошибка при загрузке мероприятий");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const addEvent = async () => {
    if (Object.values(newEvent).some(value => !value)) return alert("Заполните все поля");
    try {
      const response = await fetch("https://events-fastapi.onrender.com/events/v1/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_event: newEvent.name_event,
          date_time: `${newEvent.date}T${newEvent.time}:00.000Z`,
          location: newEvent.location,
          description: newEvent.description,
          limit_people: parseInt(newEvent.limit_people, 10)
        })
      });
      if (!response.ok) throw new Error("Ошибка при добавлении мероприятия");
      await fetchEvents();
      setNewEvent({ name_event: "", description: "", date: "", time: "", location: "", limit_people: "" });
      setModalOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const response = await fetch(`https://events-fastapi.onrender.com/events/v1/delete/${eventId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Ошибка при удалении мероприятия");
      await fetchEvents();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="events-container">
      <h1>Мероприятия</h1>
      <button className="add-event-button" onClick={() => setModalOpen(true)}>Добавить мероприятие</button>
      {modalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setModalOpen(false)}>&times;</span>
            <label className="label-left">Название мероприятия</label>
            <input type="text" name="name_event" value={newEvent.name_event} onChange={handleInputChange} />
            <label className="label-left">Описание</label>
            <textarea name="description" value={newEvent.description} onChange={handleInputChange} />
            <label className="label-left">Дата</label>
            <input type="date" name="date" value={newEvent.date} onChange={handleInputChange} />
            <label className="label-left">Время</label>
            <input type="time" name="time" value={newEvent.time} onChange={handleInputChange} />
            <label className="label-left">Место проведения</label>
            <input type="text" name="location" value={newEvent.location} onChange={handleInputChange} />
            <label className="label-left">Лимит участников</label>
            <input type="number" name="limit_people" value={newEvent.limit_people} onChange={handleInputChange} />
            <button className="save-button" onClick={addEvent}>Сохранить</button>
          </div>
        </div>
      )}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <h2 className="event-title">{event.name_event}</h2>
              <p className="event-description">{event.description}</p>
              <button className="delete-button" onClick={() => deleteEvent(event.id)}>Удалить</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;