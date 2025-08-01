import React, { useContext, useState, useEffect, useRef } from 'react';
import AuthContext from '../contexts/AuthContext';
import { 
  MdSearch, 
  MdNotifications, 
  MdArrowDropDown, 
  MdLogout,
  MdSettings,
  MdPerson,
  MdClear,
  MdDarkMode,
  MdLightMode,
  MdKeyboardArrowRight,
  MdHelp,
  MdFeedback
} from 'react-icons/md';

const Navbar = ({ notificationCount = 0, onSearch }) => {
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  // Mock notifications data
  const notifications = [
    { id: 1, type: 'info', title: 'System Update', message: 'System will be updated tonight', time: '2 min ago', read: false },
    { id: 2, type: 'warning', title: 'Low Stock Alert', message: 'Arduino Uno quantity is running low', time: '1 hour ago', read: false },
    { id: 3, type: 'success', title: 'Order Completed', message: 'Your order #12345 has been delivered', time: '3 hours ago', read: true }
  ];

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }

  const profileImgUrl = user?.profilePicUrl || user?.avatar;
  const userName = user?.name || "User";
  const userRole = user?.role || "";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch && searchQuery) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchRef.current) {
      searchRef.current.focus();
    }
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false);
  };

  const handleNotificationToggle = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You can implement dark mode logic here
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const formatTime = (timeStr) => {
    return timeStr;
  };

  return (
    <>
      <div className="navbar-enhanced">
        {/* Left Section - Search */}
        <div className="navbar-left">
          <div className="search-container">
            <MdSearch className="search-icon" />
            <input 
              ref={searchRef}
              type="text" 
              placeholder="Search components, suppliers, orders..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <MdClear />
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="navbar-right">
          {/* Dark Mode Toggle */}
          <div className="action-container">
            <button 
              className="action-btn"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <MdLightMode /> : <MdDarkMode />}
            </button>
          </div>

          {/* Notifications */}
          <div className="notification-container" ref={notificationRef}>
            <button 
              className="notification-btn"
              onClick={handleNotificationToggle}
              aria-label={`Notifications (${notificationCount} unread)`}
            >
              <MdNotifications className="notification-icon" />
              {notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  <span className="notification-count">{notificationCount} new</span>
                </div>
                
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      >
                        <div className="notification-icon-wrapper">
                          <span className="notification-type-icon">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-time">{formatTime(notification.time)}</div>
                        </div>
                        {!notification.read && <div className="unread-dot"></div>}
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <MdNotifications className="no-notifications-icon" />
                      <p>No new notifications</p>
                    </div>
                  )}
                </div>
                
                <div className="notification-footer">
                  <button className="view-all-btn">View All Notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="user-profile-container" ref={dropdownRef}>
            <button 
              className="user-profile-btn"
              onClick={handleDropdownToggle}
              aria-label="User menu"
            >
              <div className="user-avatar">
                {profileImgUrl ? (
                  <img src={profileImgUrl} alt="User Avatar" className="avatar-img" />
                ) : (
                  <span className="user-initials">{getInitials(userName)}</span>
                )}
                <div className="online-indicator"></div>
              </div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">{userRole}</span>
              </div>
              <MdArrowDropDown 
                className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`} 
              />
            </button>

            {/* Enhanced Dropdown Menu */}
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {profileImgUrl ? (
                      <img src={profileImgUrl} alt="User Avatar" />
                    ) : (
                      <span className="dropdown-initials">{getInitials(userName)}</span>
                    )}
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-name">{userName}</div>
                    <div className="dropdown-email">{user?.email || 'user@example.com'}</div>
                    <div className="dropdown-role-badge">{userRole}</div>
                  </div>
                </div>
                
                <div className="dropdown-section">
                  <div className="dropdown-section-title">Account</div>
                  <button className="dropdown-item">
                    <MdPerson className="dropdown-item-icon" />
                    <span>Profile Settings</span>
                    <MdKeyboardArrowRight className="dropdown-item-arrow" />
                  </button>
                  <button className="dropdown-item">
                    <MdSettings className="dropdown-item-icon" />
                    <span>Preferences</span>
                    <MdKeyboardArrowRight className="dropdown-item-arrow" />
                  </button>
                </div>

                <div className="dropdown-section">
                  <div className="dropdown-section-title">Support</div>
                  <button className="dropdown-item">
                    <MdHelp className="dropdown-item-icon" />
                    <span>Help Center</span>
                    <MdKeyboardArrowRight className="dropdown-item-arrow" />
                  </button>
                  <button className="dropdown-item">
                    <MdFeedback className="dropdown-item-icon" />
                    <span>Send Feedback</span>
                    <MdKeyboardArrowRight className="dropdown-item-arrow" />
                  </button>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-footer">
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <MdLogout className="dropdown-item-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Inline CSS */}
      <style jsx>{`
        .navbar-enhanced {
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
          border-bottom: 1px solid #e2e8f0;
          min-height: 72px;
          z-index: 100;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
          position: relative;
          backdrop-filter: blur(20px);
        }

        /* Left Section */
        .navbar-left {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px 18px;
          width: 100%;
          max-width: 480px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .search-container:focus-within {
          border-color: #667eea;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12), 0 4px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .search-icon {
          color: #94a3b8;
          font-size: 1.3rem;
          margin-right: 12px;
          flex-shrink: 0;
          transition: color 0.2s ease;
        }

        .search-container:focus-within .search-icon {
          color: #667eea;
        }

        .search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 1rem;
          width: 100%;
          color: #1f2937;
          font-weight: 500;
        }

        .search-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .search-clear {
          background: #e2e8f0;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          color: #64748b;
          margin-left: 8px;
          transition: all 0.2s ease;
        }

        .search-clear:hover {
          background: #cbd5e1;
          transform: scale(1.1);
        }

        /* Right Section */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }

        /* Action Buttons */
        .action-container {
          position: relative;
        }

        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
          color: #64748b;
          font-size: 1.4rem;
        }

        .action-btn:hover {
          background: #f1f5f9;
          color: #667eea;
          transform: translateY(-1px);
        }

        /* Notifications */
        .notification-container {
          position: relative;
        }

        .notification-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-btn:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .notification-icon {
          font-size: 1.5rem;
          color: #64748b;
          transition: color 0.2s ease;
        }

        .notification-btn:hover .notification-icon {
          color: #667eea;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 12px;
          padding: 3px 7px;
          min-width: 20px;
          text-align: center;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Notification Dropdown */
        .notification-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 380px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          z-index: 101;
          animation: dropdownFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 480px;
          overflow: hidden;
        }

        .notification-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .notification-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
        }

        .notification-count {
          background: #667eea;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
        }

        .notification-list {
          max-height: 320px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-item.unread {
          background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%);
        }

        .notification-icon-wrapper {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .notification-message {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .unread-dot {
          position: absolute;
          top: 20px;
          right: 16px;
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
        }

        .no-notifications {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
        }

        .no-notifications-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .notification-footer {
          padding: 16px 20px;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .view-all-btn {
          width: 100%;
          background: none;
          border: 1px solid #e2e8f0;
          padding: 10px;
          border-radius: 8px;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        /* User Profile */
        .user-profile-container {
          position: relative;
        }

        .user-profile-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .user-profile-btn:hover {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          transform: translateY(-1px);
        }

        .user-avatar {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .user-initials {
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .online-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .user-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.2;
        }

        .user-role {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
          text-transform: capitalize;
        }

        .dropdown-arrow {
          font-size: 1.5rem;
          color: #94a3b8;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
          color: #667eea;
        }

        /* Enhanced Dropdown Menu */
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 320px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          z-index: 101;
          animation: dropdownFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-header {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dropdown-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .dropdown-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dropdown-initials {
          color: white;
          font-size: 1.3rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .dropdown-email {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .dropdown-role-badge {
          display: inline-block;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dropdown-section {
          padding: 16px 0;
        }

        .dropdown-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0 24px 8px;
        }

        .dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 8px 0;
        }

        .dropdown-footer {
          padding: 16px 0;
          background: #fafbfc;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: #374151;
          transition: all 0.2s ease;
          text-align: left;
          position: relative;
        }

        .dropdown-item:hover {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding-left: 28px;
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout:hover {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #dc2626;
        }

        .dropdown-item-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .dropdown-item-arrow {
          margin-left: auto;
          font-size: 1rem;
          color: #cbd5e1;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover .dropdown-item-arrow {
          color: #667eea;
          transform: translateX(4px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .search-container {
            max-width: 300px;
          }
          
          .notification-dropdown,
          .dropdown-menu {
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          .navbar-enhanced {
            padding: 0 16px;
            min-height: 64px;
          }

          .search-container {
            max-width: 220px;
            padding: 10px 14px;
          }

          .user-info {
            display: none;
          }

          .dropdown-menu {
            width: 260px;
          }
          
          .notification-dropdown {
            width: 320px;
            right: -60px;
          }
        }

        @media (max-width: 480px) {
          .navbar-enhanced {
            padding: 0 12px;
            min-height: 56px;
            gap: 8px;
          }

          .navbar-right {
            gap: 8px;
          }

          .search-container {
            max-width: 160px;
            padding: 8px 12px;
          }

          .search-input {
            font-size: 0.9rem;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
          }

          .dropdown-menu {
            width: calc(100vw - 24px);
            right: -12px;
          }
          
          .notification-dropdown {
            width: calc(100vw - 24px);
            right: -12px;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
