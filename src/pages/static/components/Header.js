import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../../../auth/auth'; // Import auth utils
import './Header.css';
import logo from '../assets/icons/logo-grande.png';

const Header = () => {
    const navigate = useNavigate();
    const [user] = useState(getUser()); // Use getUser() utility
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout(); // Use logout() utility
        navigate('/login');
    };

    const getUserInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <header className="main-header">
            <div className="header-left">
                <div className="app-logo-text" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    <img src={logo} alt="Logo" style={{ height: '25px' }} />
                    Simplo Academy
                </div>
            </div>

            <div className="header-content">
                {/* Menu de navegação de setores */}
            </div>

            <div className="user-menu-container">
                <div id="btn-user-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div className="user-avatar">
                        {user?.foto ? (
                            <img
                                src={user.foto}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            getUserInitials(user?.nome)
                        )}
                    </div>
                    <span>{user?.nome || 'Usuário'}</span>
                    <span style={{ fontSize: '0.8em', transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
                </div>

                {isMenuOpen && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => navigate('/users')}>
                            <span className="dropdown-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                            </span>
                            Adicionar Colaborador
                        </div>
                        <div className="dropdown-item" onClick={() => navigate('/roles')}>
                            <span className="dropdown-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </span>
                            Setores
                        </div>
                        <div className="dropdown-item" onClick={() => navigate('/content')}>
                            <span className="dropdown-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                            </span>
                            Adicionar Conteúdo
                        </div>
                        <div className="dropdown-item" onClick={() => navigate('/certificates')}>
                            <span className="dropdown-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="8" r="7" />
                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                </svg>
                            </span>
                            Certificações
                        </div>
                        <div className="dropdown-item" onClick={() => user && navigate(`/profile/${user.id || user._id}`)}>
                            <span className="dropdown-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            Meu Perfil
                        </div>
                        <div className="dropdown-item" onClick={handleLogout}>
                            <span className="dropdown-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </span>
                            Sair
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '10px',
                            fontSize: '0.75rem',
                            color: '#999',
                            borderTop: '1px solid #eee',
                            marginTop: '5px'
                        }}>
                            V-0.0.1-beta
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
