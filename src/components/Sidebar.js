import React from 'react';
import { FaHome, FaUsers } from 'react-icons/fa';
import './Sidebar.css';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link to="/" className="sidebar-link">
            <FaHome className="icon" title="Главная" />
            <span className="tooltip">Главная</span>
          </Link>
        </li>
        <li>
          <Link to="/users" className="sidebar-link">
            <FaUsers className="icon" title="Пользователи" />
            <span className="tooltip">Пользователи</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;

//import React from 'react';
//import { FaHome, FaUsers } from 'react-icons/fa'; // Импортируем иконки
//import './Sidebar.css'; // Для стилизации боковой панели
//import { Link } from 'react-router-dom';

//function Sidebar() {
  //return (
    //<div className="sidebar">
      //<ul>
        //<li>
          //<Link to="/">
            //<FaHome /> {/* Иконка для главной страницы */}
            //Главная
          //</Link>
        //</li>
        //<li>
          //<Link to="/users">
            //<FaUsers /> {/* Иконка для пользователей */}
            //Пользователи
          //</Link>
        //</li>
        //{/* Добавьте другие ссылки с иконками, если нужно */}
      //</ul>
    //</div>
  //);
//}

//export default Sidebar;