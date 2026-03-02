import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, getUser } from './auth';

const ProtectedRoute = () => {
    const location = useLocation();

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const user = getUser();
    if (user && user.tipo === 'colaborador') {
        const isAllowedPath = location.pathname === '/home' || location.pathname.startsWith('/profile/');
        if (!isAllowedPath) {
            return <Navigate to="/home" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
