// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import SalesOrdersPage from './pages/OrdersPage';
import PersonalAssistant from './pages/PersonalAssistantPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // Import the new page
import PrivateRoute from './components/PrivateRoute';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import LandingPage from './pages/LandingPage';
import ScanPage from './pages/ScanPage'; // Import the ScanPage component

import './App.css';

function App() {
    // Add mobile sidebar state
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <Router>
            <div className="app-container">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />  {/* Landing page */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected routes */}
                    <Route path="/app/*" element={
                        <PrivateRoute>
                            {/* Layout wrapper for protected routes */}
                            <div className="protected-layout">
                                <Sidebar 
                                    isMobileOpen={isMobileSidebarOpen} 
                                    setIsMobileOpen={setIsMobileSidebarOpen} 
                                />
                                <div className="main-content">
                                    <Navbar 
                                        isMobileOpen={isMobileSidebarOpen}
                                        setIsMobileOpen={setIsMobileSidebarOpen}
                                        notificationCount={3}
                                    />
                                    <main className="page-content">
                                        <Routes>
                                            <Route index element={<HomePage />} />
                                            <Route path="inventory" element={<InventoryPage />} />
                                            <Route path="sales-orders" element={<SalesOrdersPage />} />
                                            <Route path="users" element={<UsersPage />} />
                                            <Route path="personal-assistant" element={<PersonalAssistant />} />
                                            <Route path="scan-it" element={<ScanPage />} />
                                            <Route path="settings" element={<SettingsPage />} />
                                            <Route path="help" element={<HelpPage />} />
                                        </Routes>
                                    </main>
                                </div>
                            </div>
                        </PrivateRoute>
                    }>
                    </Route>
                </Routes>

                {/* Add layout styles */}
                
                <style jsx>{`
                .app-container {
                    width: 100%;
                    height: 100vh;
                    overflow: hidden;
                    max-width: 100vw; /* Add this */
                }

                .protected-layout {
                    display: flex;
                    height: 100vh;
                    overflow: hidden;
                    width: 100%;
                    max-width: 100vw; /* Add this */
                }

                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0; /* Important for preventing overflow */
                    margin-left: 280px;
                    transition: margin-left 0.3s ease-in-out;
                    width: calc(100vw - 280px); /* Add this */
                    max-width: calc(100vw - 280px); /* Add this */
                }

                .page-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden; /* Add this */
                    background: #f8fafc;
                    width: 100%;
                    padding: 0; /* Remove any default padding */
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .main-content {
                    margin-left: 0;
                    width: 100vw; /* Full width on mobile */
                    max-width: 100vw;
                    }
                    
                    .page-content {
                    width: 100vw;
                    max-width: 100vw;
                    }
                }
                `}</style>  

            </div>
        </Router>
    );
}

export default App;
