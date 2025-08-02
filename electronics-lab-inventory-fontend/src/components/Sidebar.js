// src/components/Sidebar.js
import React, { useState, useContext } from 'react'; // Import useContext
import { Link, useLocation } from 'react-router-dom';
import {
    MdDashboard,
    MdInventory,
    MdShoppingCart,
    MdPeople, // Used for Suppliers, now for Users in user management
    MdReport,
    MdHelp,
    MdSettings,
    MdMenu,
    MdClose,
    MdAdminPanelSettings // Icon for Admin/Users link
} from 'react-icons/md';

import wareviewLogo from '../assets/wareview-logo.png';
import AuthContext from '../contexts/AuthContext'; // Import AuthContext

const Sidebar = () => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user } = useContext(AuthContext); // Get user from AuthContext

    // Main navigation items
    let navItems = [ // Use `let` so we can conditionally add items
        {
            name: 'Dashboard',
            icon: <MdDashboard />,
            path: '/app',
            color: '#667eea' // Corresponds to --primary
        },
        {
            name: 'Inventory',
            icon: <MdInventory />,
            path: '/app/inventory',
            color: '#3dc47e' // Corresponds to --success
        },
        {
            name: 'Orders',
            icon: <MdShoppingCart />,
            path: '/app/sales-orders',
            color: '#fd7e14' // Corresponds to --warning
        },
        {
            name: 'Personal Assistant',
            icon: <MdPeople />, // Changed from MdSmartToy as per previous usage in App.js mapping
            path: '/app/personal-assistant',
            color: '#9f7aea' // A purple accent
        },
        {
            name: 'Scan It',
            icon: <MdReport />,
            path: '/app/scan-it',
            color: '#38b2ac' // A teal accent
        },
    ];

    // Add 'Users' link only if the logged-in user is an Admin
    if (user && user.role === 'Admin') {
        navItems.splice(3, 0, { // Insert at index 3 (before Personal Assistant)
            name: 'Users',
            icon: <MdAdminPanelSettings />, // Specific icon for Admin/Users
            path: '/app/users',
            color: '#007bff' // Consistent blue for Admin-related features
        });
    }

    // Support navigation items
    const supportItems = [
        {
            name: 'Help',
            icon: <MdHelp />,
            path: '/app/help',
            color: '#f6e05e' // Yellow accent
        },
        {
            name: 'Settings',
            icon: <MdSettings />,
            path: '/app/settings',
            color: '#ed64a6' // Pink accent
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
                        {/* You can uncomment img src={wareviewLogo} if you have the image in assets */}
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
                    {/* Display logged-in user's role */}
                    {user && !isCollapsed && (
                        <div className="user-role-display">
                            Logged in as: <span className={`user-role-text role-${user.role.toLowerCase().replace(/\s/g, '-')}`}>{user.role}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Inline CSS (Refined and Centralized) */}
            <style jsx>{`
                /* Variables from App.css root are available here implicitly */
                .sidebar {
                    width: 280px;
                    min-height: 100vh;
                    background: linear-gradient(180deg, var(--bg-white) 0%, #fafbfc 100%);
                    border-right: 1px solid var(--border-light);
                    display: flex;
                    flex-direction: column;
                    position: relative; /* For z-index context */
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
                    z-index: 100; /* Ensure it's above other content on mobile */
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
                    flex-shrink: 0; /* Prevent header from shrinking */
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1; /* Allows text to expand */
                    overflow: hidden; /* Hide overflow when collapsed */
                }

                .logo {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    object-fit: contain;
                    flex-shrink: 0; /* Prevent logo from shrinking */
                }

                .logo-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--figma-text-dark-blue); /* Use theme color */
                    letter-spacing: -0.02em;
                    white-space: nowrap; /* Keep text on one line */
                    overflow: hidden;
                    text-overflow: ellipsis; /* Add ellipsis if text overflows */
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
                    color: var(--figma-primary-blue); /* Use theme color */
                }

                /* Navigation */
                .sidebar-nav {
                    flex: 1; /* Allow nav section to grow and take space */
                    padding: 20px 0;
                    overflow-y: auto; /* Enable internal scrolling */
                    scrollbar-width: none; /* Hide scrollbar for Firefox */
                    -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
                }

                .sidebar-nav::-webkit-scrollbar {
                    display: none; /* Hide scrollbar for Webkit browsers */
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
                    min-height: 48px; /* Ensure consistent height for all items */
                }

                .nav-item:hover {
                    background: var(--item-bg, #f1f5f9); /* Use item-specific background if defined */
                    color: var(--item-color, #374151); /* Use item-specific color if defined */
                    transform: translateX(2px); /* Subtle slide effect on hover */
                }

                .nav-item.active {
                    background: var(--item-bg, #f1f5f9);
                    color: var(--item-color, #374151);
                    font-weight: 600;
                    border: 1px solid var(--item-border, #e2e8f0); /* Item-specific border */
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* Subtle shadow for active item */
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
                    text-overflow: ellipsis; /* Add ellipsis if text overflows */
                }

                .active-indicator {
                    position: absolute;
                    right: 8px;
                    width: 4px;
                    height: 24px;
                    background: var(--item-color, #667eea); /* Use item-specific color */
                    border-radius: 2px;
                    opacity: 0.8;
                }

                /* Collapsed state styles */
                .collapsed .nav-text,
                .collapsed .nav-section-title,
                .collapsed .version-info {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                    pointer-events: none; /* Disable interaction with hidden text */
                    transition: opacity 0.1s ease, width 0.1s ease; /* Faster transition when collapsing */
                }

                .collapsed .nav-item {
                    justify-content: center;
                    padding: 12px;
                }

                .collapsed .active-indicator {
                    right: 4px;
                    height: 32px; /* Slightly taller indicator when collapsed */
                }

                /* Footer */
                .sidebar-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #f1f5f9;
                    margin-top: auto; /* Pushes footer to the bottom */
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
                    color: var(--figma-primary-blue); /* Default for roles */
                }
                /* Specific role colors (matching your UserPage.css badges) */
                .user-role-text.role-admin { color: #e65100; }
                .user-role-text.role-user { color: #00838f; }
                .user-role-text.role-lab-technician { color: #2e7d32; }
                .user-role-text.role-researcher { color: #6a1b9a; }
                .user-role-text.role-manufacturing-engineer { color: #1565c0; }


                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    .sidebar {
                        position: fixed; /* Fixed position for mobile overlay */
                        left: 0;
                        top: 0;
                        height: 100vh; /* Full height on mobile */
                        width: 280px; /* Default mobile width */
                        transform: translateX(-100%); /* Hidden by default */
                        transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
                        box-shadow: 0 0 15px rgba(0,0,0,0.2); /* Shadow when open */
                    }

                    .sidebar.mobile-open {
                        transform: translateX(0); /* Slide in */
                    }

                    /* When collapsed on mobile, still take default mobile width */
                    .sidebar.collapsed {
                        width: 280px; /* Collapsed state on mobile is full width but hidden */
                    }

                    /* Hide toggle button on mobile sidebar */
                    .toggle-btn {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    .sidebar {
                        width: 100vw; /* Full screen width on very small devices */
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
                    animation: slideIn 0.3s ease-out; /* Apply slide-in animation to text */
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
                    opacity: 0.05; /* Subtle overlay on hover/active */
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