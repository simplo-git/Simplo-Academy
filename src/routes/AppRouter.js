import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import UserListPage from '../pages/UserListPage';
import UserRegisterPage from '../pages/UserRegisterPage';
import RolesPage from '../pages/RolesPage';
import CertificatesPage from '../pages/CertificatesPage';
import UserProfilePage from '../pages/UserProfilePage';
import ContentPage from '../pages/ContentPage';
import TemplatesPage from '../pages/TemplatesPage';
import TemplateBuilder from '../pages/static/components/templates/TemplateBuilder';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/roles" element={<RolesPage />} />
                    <Route path="/certificates" element={<CertificatesPage />} />
                    <Route path="/content" element={<ContentPage />} />
                    <Route path="/templates" element={<TemplatesPage />} />
                    <Route path="/templates/new" element={<TemplateBuilder />} />
                    <Route path="/templates/:id/edit" element={<TemplateBuilder />} />
                    <Route path="/users" element={<UserListPage />} />
                    <Route path="/users/new" element={<UserRegisterPage />} />
                    <Route path="/users/:id/edit" element={<UserRegisterPage />} />
                    <Route path="/profile/:id" element={<UserProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
