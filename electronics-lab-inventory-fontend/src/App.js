// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
    return (
        <Router>
            <div className="app-container">
                <Routes>
        {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />  {/* Landing page */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected routes */}
                    <Route path="/app/*" element={<PrivateRoute />}>
                        <Route index element={<HomePage />} />
                        
                        <Route path="inventory" element={<InventoryPage />} />
                        <Route path="sales-orders" element={<SalesOrdersPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="personal-assistant" element={<PersonalAssistant />} />
                        <Route path="scan-it" element={<ScanPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="help" element={<HelpPage />} />
                    </Route>
                </Routes>

            </div>
        </Router>
    );
}

export default App;