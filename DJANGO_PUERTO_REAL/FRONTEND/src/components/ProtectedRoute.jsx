import React from 'react';
import { Navigate } from 'react-router-dom';

const getUserData = () => {
    try {
        const userDataString = localStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
        return null;
    }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('authToken');
    const userData = getUserData();

    // --- DEBUGGING --- 
    console.log("ProtectedRoute Check:");
    console.log("Token exists:", !!token);
    console.log("User data:", userData);
    console.log("Required roles:", allowedRoles);
    console.log("User role:", userData?.rol);
    // --- END DEBUGGING ---

    if (!token || !userData) {
        return <Navigate to="/" />;
    }

    if (allowedRoles && !allowedRoles.includes(userData.rol)) {
        console.log("Redirecting because role is not allowed.");
        return <Navigate to="/home" />;
    }

    return children;
};

export default ProtectedRoute;