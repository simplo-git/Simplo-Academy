import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth/auth';
import '../App.css'; // Importing styles
import logo from '../pages/static/assets/icons/logo-grande.png';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        try {
            setError('');
            const response = await fetch('http://192.168.0.17:9000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save user data
                // Save user data using auth utility
                login(data.token, data.user);
                // Redirect to Home
                navigate('/home');
            } else {
                const msg = data.message || 'Login failed';
                setError(`Error ${response.status}: ${msg}`);
            }
        } catch (err) {
            console.error(err);
            setError('Server connection error');
        }
    };

    return (
        <div className="App">
            <div className="login-card">
                <div className="logo-container">
                    <img src={logo} className="login-logo" alt="Simplo Academy" />
                </div>
                <h1 className="login-title">Simplo Academy</h1>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="username">USUÁRIO</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">SENHA</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0
                                }}
                                title={showPassword ? "Ocultar senha" : "Ver senha"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

                    <button type="submit" className="login-button">
                        ENTRAR <span className="arrow-icon">→</span>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
