import React, { useState } from 'react';
import { FaHome, FaUsers, FaCalendarAlt, FaNewspaper, FaCamera, FaBars } from 'react-icons/fa';
import './Sidebar.css';
import { Link } from 'react-router-dom';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="sidebar-container">
      <button
        className="toggle-button"
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Закрыть боковую панель' : 'Открыть боковую панель'}
      >
        <FaBars className="toggle-icon" />
      </button>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <Link to="/" className="sidebar-link">
              <FaHome className="icon" />
              <span className="tooltip">Главная</span>
            </Link>
          </li>
          <li>
            <Link to="/events" className="sidebar-link">
              <FaCalendarAlt className="icon" />
              <span className="tooltip">Мероприятия</span>
            </Link>
          </li>
          <li>
            <Link to="/news" className="sidebar-link">
              <FaNewspaper className="icon" />
              <span className="tooltip">Новости</span>
            </Link>
          </li>
          <li>
            <Link to="/camera" className="sidebar-link">
              <FaCamera className="icon" />
              <span className="tooltip">Камера</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;