import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import UserListPage from '../pages/UserListPage';
import UserRegisterPage from '../pages/UserRegisterPage';
import RolesPage from '../pages/RolesPage';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/roles" element={<RolesPage />} />
                    <Route path="/users" element={<UserListPage />} />
                    <Route path="/users/new" element={<UserRegisterPage />} />
                    <Route path="/users/:id/edit" element={<UserRegisterPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
