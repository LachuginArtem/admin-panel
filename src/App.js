import './App.css';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import UsersTab from './components/UsersTab';
import Events from "./components/Events";
import News from "./components/News";
import Camera from "./components/Camera";
import NotFound from "./components/NotFound";
import Login from "./components/Login"; // Новый компонент для авторизации
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import './index.css';
import PrivateRoute from './components/PrivateRoute'; // Компонент для защиты маршрутов

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  const protectedRoutes = ["/", "/users", "/events", "/news"];
  const isProtectedRoute = protectedRoutes.includes(location.pathname);

  return (
    <div className="App">
      {/* Показываем Sidebar только для авторизованных пользователей на защищенных маршрутах */}
      {isProtectedRoute && <Sidebar />}
      
      <div className="main-content">
        <Routes>
          {/* Маршрут авторизации */}
          <Route path="/login" element={<Login />} />
          
          {/* Защищенные маршруты */}
          <Route path="/" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute>
              <UsersTab />
            </PrivateRoute>
          } />
          <Route path="/events" element={
            <PrivateRoute>
              <Events />
            </PrivateRoute>
          } />
          <Route path="/news" element={
            <PrivateRoute>
              <News />
            </PrivateRoute>
          } />
          <Route path="/camera" element={
            <PrivateRoute>
              <Camera />
            </PrivateRoute>
          } />
          
          {/* Маршрут для несуществующих страниц */}
          <Route path="*" element={<NotFound />} />
          
          {/* Перенаправление с корня на /login если пользователь не авторизован */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;