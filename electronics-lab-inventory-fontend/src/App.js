// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import SalesOrdersPage from './pages/OrdersPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // Import the new page
import PrivateRoute from './components/PrivateRoute';

import './App.css';

function App() {
    return (
        <Router>
            <div className="app-container">
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} /> {/* Add this line */}
                    {/* Add forgot password routes here */}

                    {/* Protected routes */}
                    <Route path="/*" element={<PrivateRoute />}>
                        <Route index element={
                            <div className="main-area-with-right-sidebar">
                                <HomePage />
                            </div>
                        } />
                        <Route path="inventory" element={
                            <div className="main-area-with-right-sidebar">
                                <InventoryPage />
                            </div>
                        } />
                        <Route path="sales-orders" element={
                            <div className="main-area-with-right-sidebar">
                                <SalesOrdersPage />
                            </div>
                        } />
                        <Route path="suppliers" element={
                            <div className="main-area-with-right-sidebar">
                                <SuppliersPage />
                            </div>
                        } />
                        <Route path="reports" element={
                            <div className="main-area-with-right-sidebar">
                                <ReportsPage />
                            </div>
                        } />
                        {/* Add other protected routes here */}
                    </Route>
                </Routes>
            </div>
        </Router>
    );
}

export default App;