import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/HomePage.css'; // Reusing standard layout styles

const UserListPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                setError('Failed to fetch users');
            }
        } catch (err) {
            console.error(err);
            setError('Server connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/users/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setUsers(users.filter(user => user._id !== id));
                } else {
                    alert('Erro ao excluir usuário');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        }
    };

    return (
        <div className="home-container">
            <Header />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#333' }}>Gestão de Usuários</h2>
                    <button
                        onClick={() => navigate('/users/new')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Adicionar Colaborador
                    </button>
                </div>

                {loading && <p>Carregando...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {!loading && !error && (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f4f6f8', borderBottom: '2px solid #ddd' }}>
                                <tr>
                                    <th style={{ padding: '15px' }}>Foto</th>
                                    <th style={{ padding: '15px' }}>Nome</th>
                                    <th style={{ padding: '15px' }}>Email</th>
                                    <th style={{ padding: '15px' }}>Setor</th>
                                    <th style={{ padding: '15px' }}>Cargo</th>
                                    <th style={{ padding: '15px' }}>Tipo</th>
                                    <th style={{ padding: '15px' }}>Status</th>
                                    <th style={{ padding: '15px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 15px' }}>
                                            {user.foto ? (
                                                <img src={user.foto} alt={user.nome} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#888' }}>
                                                    {user.nome ? user.nome.substring(0, 2).toUpperCase() : 'U'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '10px 15px' }}>{user.nome}</td>
                                        <td style={{ padding: '10px 15px' }}>{user.email}</td>
                                        <td style={{ padding: '10px 15px' }}>{user.setor}</td>
                                        <td style={{ padding: '10px 15px' }}>{user.cargo}</td>
                                        <td style={{ padding: '10px 15px' }}>{user.tipo}</td>
                                        <td style={{ padding: '10px 15px' }}>
                                            <span style={{
                                                padding: '5px 10px',
                                                borderRadius: '15px',
                                                fontSize: '0.85em',
                                                backgroundColor: user.status === 'ativo' ? '#e8f5e9' : '#ffebee',
                                                color: user.status === 'ativo' ? '#2e7d32' : '#c62828'
                                            }}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 15px' }}>
                                            <button
                                                onClick={() => navigate(`/users/${user._id}/edit`)}
                                                style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: 'transparent',
                                                    color: '#007bff',
                                                    border: '1px solid #007bff',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85em',
                                                    marginRight: '10px'
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                style={{
                                                    padding: '5px 10px',
                                                    backgroundColor: 'transparent',
                                                    color: '#dc3545',
                                                    border: '1px solid #dc3545',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85em'
                                                }}
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserListPage;
