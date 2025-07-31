// src/components/PrivateRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// import AuthContext from '../contexts/AuthContext'; // You'll create this if needed for global state
import api from '../utils/api'; // For checking token validity

const PrivateRoute = ({ children, allowedRoles }) => {
    // State to manage authentication status, loading, and user role
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null); // Get this from AuthContext/API

    useEffect(() => {
        // Function to verify user's authentication token with the backend
        const verifyAuth = async () => {
            const token = localStorage.getItem('token'); // Retrieve token from local storage

            // If no token is found, user is not authenticated
            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                // Call your backend /api/auth/me endpoint to verify the token
                // and fetch user data, including their role.
                const res = await api.get('/auth/me');
                if (res.data.success) {
                    setIsAuthenticated(true);
                    setUserRole(res.data.data.role); // Set the user's role from the response
                } else {
                    // If backend indicates token is invalid, set isAuthenticated to false
                    // and remove the invalid token from local storage.
                    setIsAuthenticated(false);
                    localStorage.removeItem('token');
                }
            } catch (error) {
                // Handle any errors during the API call (e.g., network issues, server errors)
                console.error('Authentication verification failed:', error);
                setIsAuthenticated(false);
                localStorage.removeItem('token'); // Clear token on error
            } finally {
                setLoading(false); // Set loading to false once verification is complete
            }
        };

        verifyAuth(); // Execute the authentication verification on component mount
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // Display a loading message or spinner while authentication is being checked
    if (loading) {
        return <div>Checking authentication...</div>;
    }

    // If not authenticated, redirect to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If allowedRoles are specified, check if the user's role is included
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // If the user's role is not allowed, redirect to an unauthorized page
        return <Navigate to="/unauthorized" replace />;
    }

    // If authenticated and authorized, render the children components or the Outlet
    // The Sidebar is included here as it's typically part of the authenticated layout.
    return (
        <div className="app-layout">
            {/* Sidebar is always present for authenticated routes */}
            {/* It's rendered here because App.js nests protected routes under PrivateRoute */}
            {children ? children : <Outlet />}
        </div>
    );
};

export default PrivateRoute;
