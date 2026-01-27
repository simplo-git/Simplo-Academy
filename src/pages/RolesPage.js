import React, { useState, useEffect } from 'react';
import Header from './static/components/Header';
import './static/css/HomePage.css'; // Reusing standard layout styles

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ nome: '' });

    // Fetch Roles
    const fetchRoles = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            } else {
                setError('Failed to fetch roles');
            }
        } catch (err) {
            console.error(err);
            setError('Server connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({ nome: role.nome });
        } else {
            setEditingRole(null);
            setFormData({ nome: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setFormData({ nome: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingRole
            ? `http://127.0.0.1:5000/api/roles/${editingRole._id}`
            : 'http://127.0.0.1:5000/api/roles';
        const method = editingRole ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                handleCloseModal();
                fetchRoles(); // Refresh list
            } else {
                alert('Erro ao salvar cargo');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este cargo?')) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/roles/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchRoles();
                } else {
                    alert('Erro ao excluir cargo');
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
                    <h2 style={{ color: '#333' }}>Gestão de Setores</h2>
                    <button
                        onClick={() => handleOpenModal()}
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
                        + Adicionar Cargo
                    </button>
                </div>

                {/* List */}
                {loading && <p>Carregando...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f4f6f8', borderBottom: '2px solid #ddd' }}>
                                <tr>
                                    <th style={{ padding: '15px' }}>Nome</th>
                                    <th style={{ padding: '15px', width: '150px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                            Nenhum cargo cadastrado.
                                        </td>
                                    </tr>
                                ) : (
                                    roles.map(role => (
                                        <tr key={role._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px' }}>{role.nome}</td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => handleOpenModal(role)}
                                                    style={{ marginRight: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role._id)}
                                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            width: '400px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ marginTop: 0 }}>{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nome do Cargo</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#ddd',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '8px 16px',
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RolesPage;
