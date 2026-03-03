import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCodeTooltip, setShowCodeTooltip] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopyCode = () => {
    if (user?.userCode) {
      navigator.clipboard.writeText(user.userCode);
    }
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
          <Link to="/voting-methods" className="navbar-link">Объяснение методов</Link>
          <div className="navbar-user">
            {user?.userCode && (
              <div
                className="user-code-badge"
                onClick={handleCopyCode}
                onMouseEnter={() => setShowCodeTooltip(true)}
                onMouseLeave={() => setShowCodeTooltip(false)}
                title="Нажмите, чтобы скопировать"
              >
                <span className="user-code-label">Мой код</span>
                <span className="user-code-value">{user.userCode}</span>
                {showCodeTooltip && (
                  <div className="user-code-tooltip">
                    Ваш уникальный код — поделитесь им, чтобы вас добавили в группу
                  </div>
                )}
              </div>
            )}
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
