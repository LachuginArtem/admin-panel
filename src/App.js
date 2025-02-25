import './App.css';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard'; 
import UsersTab from './components/UsersTab';
import Events from "./components//Events";
import { Route, Routes } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<UsersTab />} />
          <Route path="/events" element={<Events />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
