import React from 'react';
import { FaHome, FaUsers, FaCog, FaSignInAlt } from 'react-icons/fa'; // Импортируем иконки
import './Sidebar.css'; // Для стилизации боковой панели

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li title="Главная"><FaHome className="icon" /></li>
        <li title="Пользователи"><FaUsers className="icon" /></li>
        <li title="Настройки"><FaCog className="icon" /></li>
        <li title="Выход"><FaSignInAlt className="icon" /></li>
      </ul>
    </div>
  );
};

export default Sidebar;
