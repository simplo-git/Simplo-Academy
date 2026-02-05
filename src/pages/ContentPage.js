import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import ContentWizard from './static/components/ContentWizard';
import ContentTrackingModal from './static/components/ContentTrackingModal';
import './static/css/HomePage.css'; // Reusing standard layout styles

const ContentPage = () => {
    const navigate = useNavigate();
    const [contents, setContents] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [editingContent, setEditingContent] = useState(null);
    const [trackingContent, setTrackingContent] = useState(null); // State for tracking modal

    // Fetch Contents
    const fetchContents = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/conteudos');
            if (response.ok) {
                const data = await response.json();
                setContents(data);
            } else {
                setError('Falha ao carregar conteúdos');
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContents();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (err) {
            console.error('Erro ao carregar roles:', err);
        }
    };

    const handleOpenTemplateModal = () => {
        navigate('/templates');
    };

    const handleEdit = (content) => {
        setEditingContent(content);
        setIsWizardOpen(true);
    };

    const handleCloseWizard = () => {
        setIsWizardOpen(false);
        setEditingContent(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchContents();
                } else {
                    alert('Erro ao excluir conteúdo');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        }
    };

    const getTipoLabel = (tipo) => {
        // Fallback for new structure where 'tipo' might not exist directly on the content,
        // or getting it from the first template?
        // The new model doesn't explicitly have a 'tipo' field (it has 'conteudos').
        // We can show 'Mix' or just the correction type?
        // Let's rely on 'correcao' or just 'nivel'.
        return tipo || '-';
    };

    return (
        <div className="home-container">
            <Header />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#333' }}>Central de Conteúdos</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => { setEditingContent(null); setIsWizardOpen(true); }}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px rgba(0,123,255,0.2)'
                            }}
                        >
                            + Adicionar Conteúdo
                        </button>
                        <button
                            onClick={handleOpenTemplateModal}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            📋 Gerenciar Templates
                        </button>
                    </div>
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
                                    <th style={{ padding: '15px' }}>Nível</th>
                                    <th style={{ padding: '15px' }}>Correção</th>
                                    <th style={{ padding: '15px' }}>Alunos</th>
                                    <th style={{ padding: '15px', width: '280px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📭</div>
                                            Nenhum conteúdo cadastrado.
                                        </td>
                                    </tr>
                                ) : (
                                    contents.map(content => (
                                        <tr key={content._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ fontWeight: '600', color: '#333' }}>{content.nome}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#777' }}>
                                                    {content.setores && content.setores.length > 0
                                                        ? content.setores.map(s => {
                                                            if (typeof s === 'object') return s.nome || s.id || JSON.stringify(s); // Handle object safe
                                                            return roles.find(r => r._id === s)?.nome || s;
                                                        }).join(', ')
                                                        : (content.setor && typeof content.setor === 'object' ? content.setor.nome : content.setor) || '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1976d2',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Nível {content.nivel}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                {content.correcao === 'automatica' ? '🤖 Automática' : '✍️ Manual'}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                {content.usuarios ? Object.keys(content.usuarios).length : 0}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => setTrackingContent(content)}
                                                    style={{ marginRight: '10px', background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', fontWeight: '500' }}
                                                >
                                                    Acompanhar
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(content)}
                                                    style={{ marginRight: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: '500' }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(content._id)}
                                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: '500' }}
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

                {/* Wizard Modal */}
                {isWizardOpen && (
                    <ContentWizard
                        onClose={handleCloseWizard}
                        onSuccess={() => {
                            fetchContents();
                        }}
                        initialData={editingContent}
                    />
                )}

                {/* Tracking Modal */}
                {trackingContent && (
                    <ContentTrackingModal
                        content={trackingContent}
                        onClose={() => setTrackingContent(null)}
                    />
                )}

            </main>
        </div>
    );
};

export default ContentPage;


