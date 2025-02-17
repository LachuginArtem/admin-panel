
import './App.css';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard'; 
import UsersTab from './components/UsersTab';  // Импортируем компонент с информацией о подписчиках
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <div className="main-content">
          <Routes>
            {/* Главная страница или Dashboard */}
            <Route path="/" element={<AdminDashboard />} />
            {/* Вкладка пользователей */}
            <Route path="/users" element={<UsersTab />} />
            {/* Добавьте другие маршруты, если необходимо */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
