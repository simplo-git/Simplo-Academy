import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth/auth';
import '../App.css'; // Importing styles
import logo from '../pages/static/assets/icons/logo-grande.png';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            setError('');
            const response = await fetch('http://127.0.0.1:5000/api/users/login', {
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

                <div className="login-form">
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
                        <input
                            type="password"
                            id="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

                    <button className="login-button" onClick={handleLogin}>
                        ENTRAR <span className="arrow-icon">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
