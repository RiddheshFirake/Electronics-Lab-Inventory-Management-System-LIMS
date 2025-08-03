// src/components/Sidebar.js
import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    MdDashboard,
    MdInventory,
    MdShoppingCart,
    MdPeople,
    MdReport,
    MdHelp,
    MdSettings,
    MdMenu,
    MdClose,
    MdAdminPanelSettings
} from 'react-icons/md';

import wareviewLogo from '../assets/wareviewLogo.ico';
import AuthContext from '../contexts/AuthContext';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user } = useContext(AuthContext);

    // Main navigation items
    let navItems = [
        {
            name: 'Dashboard',
            icon: <MdDashboard />,
            path: '/app',
            color: '#667eea'
        },
        {
            name: 'Inventory',
            icon: <MdInventory />,
            path: '/app/inventory',
            color: '#3dc47e'
        },
        {
            name: 'Orders',
            icon: <MdShoppingCart />,
            path: '/app/sales-orders',
            color: '#fd7e14'
        },
        {
            name: 'Personal Assistant',
            icon: <MdPeople />,
            path: '/app/personal-assistant',
            color: '#9f7aea'
        },
        {
            name: 'Scan It',
            icon: <MdReport />,
            path: '/app/scan-it',
            color: '#38b2ac'
        },
    ];

    // Add 'Users' link only if the logged-in user is an Admin
    if (user && user.role === 'Admin') {
        navItems.splice(3, 0, {
            name: 'Users',
            icon: <MdAdminPanelSettings />,
            path: '/app/users',
            color: '#007bff'
        });
    }

    // Support navigation items
    const supportItems = [
        {
            name: 'Help',
            icon: <MdHelp />,
            path: '/app/help',
            color: '#f6e05e'
        },
        {
            name: 'Settings',
            icon: <MdSettings />,
            path: '/app/settings',
            color: '#ed64a6'
        },
    ];

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleMobileLinkClick = () => {
        // Close mobile sidebar when a link is clicked
        if (setIsMobileOpen) {
            setIsMobileOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="mobile-overlay"
                    onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                />
            )}
            
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div className="logo-container">
                        <img src={wareviewLogo} alt="WareView Logo" className="logo" />
                        {!isCollapsed && <span className="logo-text">WareView</span>}
                    </div>
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        {isCollapsed ? <MdMenu /> : <MdClose />}
                    </button>
                </div>

                {/* Main Navigation */}
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        {!isCollapsed && <div className="nav-section-title">GENERAL</div>}
                        <div className="nav-items">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        style={{
                                            '--item-color': item.color,
                                            '--item-bg': `${item.color}15`,
                                            '--item-border': `${item.color}25`
                                        }}
                                        onClick={handleMobileLinkClick}
                                    >
                                        <div className="nav-icon">
                                            {item.icon}
                                        </div>
                                        {!isCollapsed && (
                                            <span className="nav-text">{item.name}</span>
                                        )}
                                        {isActive && <div className="active-indicator"></div>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="nav-section">
                        {!isCollapsed && <div className="nav-section-title">SUPPORT</div>}
                        <div className="nav-items">
                            {supportItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        style={{
                                            '--item-color': item.color,
                                            '--item-bg': `${item.color}15`,
                                            '--item-border': `${item.color}25`
                                        }}
                                        onClick={handleMobileLinkClick}
                                    >
                                        <div className="nav-icon">
                                            {item.icon}
                                        </div>
                                        {!isCollapsed && (
                                            <span className="nav-text">{item.name}</span>
                                        )}
                                        {isActive && <div className="active-indicator"></div>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="sidebar-footer">
                    <div className="version-info">
                        {!isCollapsed && <span>v1.0.0</span>}
                    </div>
                    {user && !isCollapsed && (
                        <div className="user-role-display">
                            Logged in as: <span className={`user-role-text role-${user.role.toLowerCase().replace(/\s/g, '-')}`}>{user.role}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Updated CSS with mobile overlay and proper mobile functionality */}
            <style jsx>{`
                .mobile-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                    display: none;
                }

                .sidebar {
                    width: 280px;
                    min-height: 100vh;
                    background: linear-gradient(180deg, var(--bg-white, #ffffff) 0%, #fafbfc 100%);
                    border-right: 1px solid var(--border-light, #e2e8f0);
                    display: flex;
                    flex-direction: column;
                    position: fixed;
                    top: 0;
                    left: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
                    z-index: 1000;
                }

                .sidebar.collapsed {
                    width: 70px;
                }

                /* Header */
                .sidebar-header {
                    padding: 24px 20px 20px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 80px;
                    flex-shrink: 0;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    overflow: hidden;
                }

                .logo {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    object-fit: contain;
                    flex-shrink: 0;
                }

                .logo-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--figma-text-dark-blue, #1f2937);
                    letter-spacing: -0.02em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .toggle-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: #f8fafc;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s ease;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .toggle-btn:hover {
                    background: #e2e8f0;
                    color: var(--figma-primary-blue, #667eea);
                }

                /* Navigation */
                .sidebar-nav {
                    flex: 1;
                    padding: 20px 0;
                    overflow-y: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .sidebar-nav::-webkit-scrollbar {
                    display: none;
                }

                .nav-section {
                    margin-bottom: 32px;
                }

                .nav-section:last-child {
                    margin-bottom: 0;
                }

                .nav-section-title {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0 20px 12px 20px;
                    padding-left: 8px;
                }

                .nav-items {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 0 16px;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: #64748b;
                    font-weight: 500;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                    min-height: 48px;
                }

                .nav-item:hover {
                    background: var(--item-bg, #f1f5f9);
                    color: var(--item-color, #374151);
                    transform: translateX(2px);
                }

                .nav-item.active {
                    background: var(--item-bg, #f1f5f9);
                    color: var(--item-color, #374151);
                    font-weight: 600;
                    border: 1px solid var(--item-border, #e2e8f0);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }

                .nav-icon {
                    font-size: 1.3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .nav-text {
                    opacity: 1;
                    transition: opacity 0.2s ease;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .active-indicator {
                    position: absolute;
                    right: 8px;
                    width: 4px;
                    height: 24px;
                    background: var(--item-color, #667eea);
                    border-radius: 2px;
                    opacity: 0.8;
                }

                /* Collapsed state styles */
                .collapsed .nav-text,
                .collapsed .nav-section-title,
                .collapsed .version-info,
                .collapsed .user-role-display {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                    pointer-events: none;
                    transition: opacity 0.1s ease, width 0.1s ease;
                }

                .collapsed .logo-text {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                    transition: opacity 0.1s ease, width 0.1s ease;
                }

                .collapsed .nav-item {
                    justify-content: center;
                    padding: 12px 8px;
                    margin: 0 8px;
                }

                .collapsed .nav-items {
                    padding: 0 8px;
                }

                .collapsed .sidebar-header {
                    padding: 24px 12px 20px 12px;
                    justify-content: center;
                }

                .collapsed .logo-container {
                    justify-content: center;
                }

                .collapsed .active-indicator {
                    right: 2px;
                    height: 32px;
                    width: 3px;
                }

                .collapsed .sidebar-footer {
                    padding: 16px 8px;
                }

                /* Footer */
                .sidebar-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #f1f5f9;
                    margin-top: auto;
                    text-align: center;
                    flex-shrink: 0;
                }

                .version-info {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .user-role-display {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    font-weight: 500;
                    margin-top: 8px;
                }

                .user-role-text {
                    font-weight: 600;
                    text-transform: capitalize;
                    color: var(--figma-primary-blue, #667eea);
                }

                .user-role-text.role-admin { color: #e65100; }
                .user-role-text.role-user { color: #00838f; }
                .user-role-text.role-lab-technician { color: #2e7d32; }
                .user-role-text.role-researcher { color: #6a1b9a; }
                .user-role-text.role-manufacturing-engineer { color: #1565c0; }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .mobile-overlay {
                        display: block !important;
                    }

                    .sidebar {
                        transform: translateX(-100%);
                        transition: transform 0.3s ease-in-out;
                        box-shadow: 0 0 20px rgba(0,0,0,0.3);
                    }

                    .sidebar.mobile-open {
                        transform: translateX(0);
                    }

                    .sidebar.collapsed {
                        width: 280px;
                        transform: translateX(-100%);
                    }

                    .sidebar.collapsed.mobile-open {
                        transform: translateX(0);
                    }

                    /* Hide desktop toggle button on mobile */
                    .toggle-btn {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    .sidebar {
                        width: 100vw;
                    }

                    .nav-items {
                        padding: 0 12px;
                    }

                    .nav-item {
                        padding: 14px 16px;
                        min-height: 52px;
                    }

                    .nav-icon {
                        font-size: 1.4rem;
                    }
                }

                /* Animation for expand/collapse */
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: translateX(-8px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .nav-text {
                    animation: slideIn 0.3s ease-out;
                }

                /* Hover effects */
                .nav-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, var(--item-color, transparent) 0%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .nav-item:hover::before,
                .nav-item.active::before {
                    opacity: 0.05;
                }

                /* Scrollbar styling */
                .sidebar-nav {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e0 transparent;
                }

                .sidebar-nav::-webkit-scrollbar {
                    width: 4px;
                }

                .sidebar-nav::-webkit-scrollbar-track {
                    background: transparent;
                }

                .sidebar-nav::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 2px;
                }

                .sidebar-nav::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }
            `}</style>
        </>
    );
};

export default Sidebar;
