import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCodeTooltip, setShowCodeTooltip] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-logo">
            📊 <span className="navbar-logo-text">{t('navbar.appName')}</span>
          </Link>

          {/* Desktop menu */}
          <div className="navbar-menu">
            <Link to="/dashboard" className="navbar-link">{t('navbar.home')}</Link>
            <Link to="/groups" className="navbar-link">{t('navbar.myGroups')}</Link>
            <Link to="/voting-methods" className="navbar-link">{t('navbar.votingMethods')}</Link>
            <div className="navbar-user">
              {user?.userCode && (
                <div
                  className="user-code-badge"
                  onClick={handleCopyCode}
                  onMouseEnter={() => setShowCodeTooltip(true)}
                  onMouseLeave={() => setShowCodeTooltip(false)}
                  title={t('navbar.clickToCopy')}
                >
                  <span className="user-code-label">{t('navbar.myCode')}</span>
                  <span className="user-code-value">{user.userCode}</span>
                  {showCodeTooltip && (
                    <div className="user-code-tooltip">
                      {t('navbar.codeDescription')}
                    </div>
                  )}
                </div>
              )}
              <Link to="/profile" className="navbar-username">
                {user?.avatarEmoji || '👤'} {user?.username}
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                {t('common.logout')}
              </button>
            </div>
          </div>

          {/* Hamburger button — mobile only */}
          <button
            className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={t('navbar.openMenu')}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Dark overlay */}
      <div
        className={`nav-overlay${menuOpen ? ' nav-overlay--visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Side drawer */}
      <div className={`nav-drawer${menuOpen ? ' nav-drawer--open' : ''}`}>
        {/* User block */}
        <div className="nav-drawer-user">
          <div className="nav-drawer-avatar">{user?.avatarEmoji || '👤'}</div>
          <div className="nav-drawer-user-info">
            <div className="nav-drawer-username">{user?.username}</div>
            <div className="nav-drawer-email">{user?.email}</div>
          </div>
        </div>

        {/* Code badge */}
        {user?.userCode && (
          <div
            className="nav-drawer-code"
            onClick={handleCopyCode}
            title={t('navbar.clickToCopy')}
          >
            <span className="user-code-label">{t('navbar.myCode')}</span>
            <span className="user-code-value">{user.userCode}</span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="nav-drawer-links">
          <Link to="/dashboard" className="nav-drawer-link">🏠 {t('navbar.home')}</Link>
          <Link to="/groups" className="nav-drawer-link">👥 {t('navbar.myGroups')}</Link>
          <Link to="/voting-methods" className="nav-drawer-link">📖 {t('navbar.votingMethods')}</Link>
          <Link to="/profile" className="nav-drawer-link">👤 {t('navbar.profile')}</Link>
        </nav>

        <button onClick={handleLogout} className="btn btn-secondary nav-drawer-logout">
          {t('common.logout')}
        </button>
      </div>
    </>
  );
};

export default Navbar;
