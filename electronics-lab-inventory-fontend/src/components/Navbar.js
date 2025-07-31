import React, { useContext, useState } from 'react';
import AuthContext from '../contexts/AuthContext';
import { 
  MdSearch, 
  MdNotifications, 
  MdArrowDropDown, 
  MdLogout,
  MdSettings,
  MdPerson
} from 'react-icons/md';

const Navbar = ({ notificationCount = 0 }) => {
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  }

  const profileImgUrl = user?.profilePicUrl || user?.avatar;
  const userName = user?.name || "User";
  const userRole = user?.role || "";

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <>
      <div className="navbar-enhanced">
        {/* Left Section - Search */}
        <div className="navbar-left">
          <div className="search-container">
            <MdSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search components, suppliers, orders..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Notifications & Profile */}
        <div className="navbar-right">
          {/* Notifications */}
          <div className="notification-container">
            <button className="notification-btn">
              <MdNotifications className="notification-icon" />
              {notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className="user-profile-container">
            <button 
              className="user-profile-btn"
              onClick={handleDropdownToggle}
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

            {/* Dropdown Menu */}
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
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-items">
                  <button className="dropdown-item">
                    <MdPerson className="dropdown-item-icon" />
                    <span>Profile</span>
                  </button>
                  <button className="dropdown-item">
                    <MdSettings className="dropdown-item-icon" />
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <MdLogout className="dropdown-item-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click overlay to close dropdown */}
        {isDropdownOpen && (
          <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)}></div>
        )}
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
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          max-width: 420px;
          transition: all 0.2s ease;
        }

        .search-container:focus-within {
          border-color: #667eea;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          color: #94a3b8;
          font-size: 1.25rem;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.95rem;
          width: 100%;
          color: #1f2937;
          font-weight: 400;
        }

        .search-input::placeholder {
          color: #94a3b8;
        }

        .search-clear {
          background: #e2e8f0;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
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
        }

        /* Right Section */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: auto;
        }

        /* Notifications */
        .notification-container {
          position: relative;
        }

        .notification-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          position: relative;
        }

        .notification-btn:hover {
          background: #f1f5f9;
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
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 10px;
          padding: 2px 6px;
          min-width: 18px;
          text-align: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
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
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .user-profile-btn:hover {
          background: #f8fafc;
        }

        .user-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
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
          font-weight: 400;
          text-transform: capitalize;
        }

        .dropdown-arrow {
          font-size: 1.5rem;
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        /* Dropdown Menu */
        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 99;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 101;
          animation: dropdownFadeIn 0.2s ease-out;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .dropdown-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dropdown-initials {
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .dropdown-user-info {
          flex: 1;
        }

        .dropdown-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .dropdown-email {
          font-size: 0.85rem;
          color: #64748b;
        }

        .dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 0 20px;
        }

        .dropdown-items {
          padding: 12px 0;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: #374151;
          transition: all 0.2s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .dropdown-item.logout:hover {
          background: #fef2f2;
        }

        .dropdown-item-icon {
          font-size: 1.1rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .navbar-enhanced {
            padding: 0 16px;
            min-height: 64px;
          }

          .search-container {
            max-width: 200px;
          }

          .user-info {
            display: none;
          }

          .dropdown-menu {
            width: 240px;
          }
        }

        @media (max-width: 480px) {
          .navbar-enhanced {
            padding: 0 12px;
            min-height: 56px;
          }

          .search-container {
            max-width: 140px;
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
        }
      `}</style>
    </>
  );
};

export default Navbar;
