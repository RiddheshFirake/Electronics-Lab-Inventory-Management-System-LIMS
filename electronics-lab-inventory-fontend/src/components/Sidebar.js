// src/components/Sidebar.js
import React, { useState } from 'react';
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
    MdClose
} from 'react-icons/md';

import wareviewLogo from '../assets/wareview-logo.png';

const Sidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Main navigation items
    const navItems = [
        {
            name: 'Dashboard',
            icon: <MdDashboard />,
            path: '/',
            color: '#667eea'
        },
        {
            name: 'Inventory',
            icon: <MdInventory />,
            path: '/inventory',
            color: '#3dc47e'
        },
        {
            name: 'Orders',
            icon: <MdShoppingCart />,
            path: '/sales-orders',
            color: '#fd7e14'
        },
        {
            name: 'Personal Assistant(to do)',
            icon: <MdPeople />,
            path: '/suppliers',
            color: '#9f7aea'
        },
        {
            name: 'Reports',
            icon: <MdReport />,
            path: '/reports',
            color: '#38b2ac'
        },
    ];

    // Support navigation items
    const supportItems = [
        {
            name: 'Help',
            icon: <MdHelp />,
            path: '/help',
            color: '#f6e05e'
        },
        {
            name: 'Settings',
            icon: <MdSettings />,
            path: '/settings',
            color: '#ed64a6'
        },
    ];

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <>
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div className="logo-container">
                        {/* <img src={wareviewLogo} alt="WareView Logo" className="logo" /> */}
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
                </div>
            </div>

            {/* Inline CSS */}
            <style jsx>{`
                .sidebar {
                    width: 280px;
                    min-height: 100vh;
                    background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
                    border-right: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
                    z-index: 100;
                }

                .sidebar.collapsed {
                    width: 80px;
                }

                /* Header */
                .sidebar-header {
                    padding: 24px 20px 20px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 80px;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .logo {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    object-fit: contain;
                }

                .logo-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1f2937;
                    letter-spacing: -0.02em;
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
                }

                .toggle-btn:hover {
                    background: #e2e8f0;
                    color: #374151;
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

                .collapsed .nav-text {
                    opacity: 0;
                }

                .collapsed .nav-item {
                    justify-content: center;
                    padding: 12px;
                }

                .collapsed .active-indicator {
                    right: 4px;
                    height: 32px;
                }

                /* Footer */
                .sidebar-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #f1f5f9;
                    margin-top: auto;
                }

                .version-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .sidebar {
                        position: fixed;
                        left: 0;
                        top: 0;
                        z-index: 1000;
                        transform: translateX(-100%);
                    }

                    .sidebar.mobile-open {
                        transform: translateX(0);
                    }

                    .sidebar.collapsed {
                        width: 280px;
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

                /* Scrollbar styling for webkit browsers */
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
