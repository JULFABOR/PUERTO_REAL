import React from 'react';
import { Navigate } from 'react-router-dom';

const getUserData = () => {
    try {
        const userDataString = localStorage.getItem('userData');
        return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
    }
};

const RoleBasedRedirect = () => {
    const userData = getUserData();
    console.log("User data from localStorage:", userData);
    const role = userData?.rol;
    console.log("User role:", role);

    if (role === 'JEFE' || role === 'Gerente de Tienda') {
        return <Navigate to="/jefe" />;
    } else if (role === 'EMPLEADO') {
        return <Navigate to="/empleado" />;
    } else if (role === 'CLIENTE') {
        return <Navigate to="/cliente" />;
    }

    // Fallback if role not found, redirect to login
    console.log("Role not found or invalid, redirecting to login.");
    return <Navigate to="/" />;
};

export default RoleBasedRedirect;