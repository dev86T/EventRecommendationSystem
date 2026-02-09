import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          📊 Система Рекомендаций Мероприятий
        </Link>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Главная</Link>
          <Link to="/groups" className="navbar-link">Мои группы</Link>
          <div className="navbar-user">
            <span className="navbar-username">👤 {user?.username}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Выход
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
