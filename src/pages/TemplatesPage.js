import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/HomePage.css';

const TemplatesPage = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('');

    const activityTypes = [
        { value: '', label: 'Todos os tipos' },
        { value: 'multipla_escolha', label: 'Múltipla Escolha', icon: '❓' },
        { value: 'video', label: 'Vídeo', icon: '🎬' },
        { value: 'texto_livre', label: 'Texto Livre', icon: '📝' },
        { value: 'upload', label: 'Upload', icon: '📤' },
        { value: 'documento', label: 'Documento', icon: '📄' },
        { value: 'artigo', label: 'Artigo', icon: '📰' }
    ];

    const fetchTemplates = async () => {
        try {
            const url = filterType
                ? `http://127.0.0.1:5000/api/activity-templates?tipo=${filterType}`
                : 'http://127.0.0.1:5000/api/activity-templates';

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            } else {
                setError('Falha ao carregar templates');
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [filterType]);

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este template?')) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/activity-templates/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchTemplates();
                } else {
                    alert('Erro ao excluir template');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        }
    };

    const handleDuplicate = async (template) => {
        const duplicatedData = {
            ...template,
            nome: `${template.nome} (Cópia)`,
            _id: undefined
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/activity-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duplicatedData)
            });
            if (response.ok) {
                fetchTemplates();
            } else {
                alert('Erro ao duplicar template');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        }
    };

    const getActivityCount = (template) => {
        return template.atividades?.length || 0;
    };

    const getActivityTypesSummary = (template) => {
        const types = (template.atividades || []).reduce((acc, act) => {
            const type = activityTypes.find(t => t.value === act.tipo);
            if (type) {
                acc.push(type.icon);
            }
            return acc;
        }, []);
        return [...new Set(types)].join(' ');
    };

    return (
        <div className="home-container">
            <Header />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#333' }}>Templates de Atividades</h2>
                    <button
                        onClick={() => navigate('/templates/new')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#0069d9';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#007bff';
                        }}
                    >
                        + Criar Novo Template
                    </button>
                </div>

                {/* Filters */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label style={{ fontWeight: '500', color: '#555' }}>Filtrar por tipo:</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{
                                padding: '8px 15px',
                                borderRadius: '6px',
                                border: '1px solid #ddd',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            {activityTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon ? `${type.icon} ` : ''}{type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* List */}
                {loading && <p>Carregando...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px'
                    }}>
                        {templates.length === 0 ? (
                            <div style={{
                                gridColumn: '1 / -1',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '60px 40px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📋</div>
                                <h3 style={{ color: '#333', marginBottom: '10px' }}>Nenhum template encontrado</h3>
                                <p style={{ color: '#666', marginBottom: '20px' }}>
                                    Crie seu primeiro template para começar a construir atividades personalizadas.
                                </p>
                                <button
                                    onClick={() => navigate('/templates/new')}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Criar Primeiro Template
                                </button>
                            </div>
                        ) : (
                            templates.map(template => (
                                <div
                                    key={template._id}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                                    }}
                                >
                                    {/* Card Header Accent */}
                                    <div style={{
                                        height: '6px',
                                        backgroundColor: '#2d3e50'
                                    }}></div>

                                    {/* Card Content */}
                                    <div style={{ padding: '20px' }}>
                                        <h3 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '1.1rem',
                                            color: '#333',
                                            fontWeight: '600'
                                        }}>
                                            {template.nome}
                                        </h3>

                                        {template.descricao && (
                                            <p style={{
                                                color: '#666',
                                                fontSize: '0.9rem',
                                                margin: '0 0 15px 0',
                                                lineHeight: '1.4',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {template.descricao}
                                            </p>
                                        )}

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '15px'
                                        }}>
                                            <span style={{
                                                backgroundColor: '#e3f2fd',
                                                color: '#007bff',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: '500'
                                            }}>
                                                {getActivityCount(template)} atividade(s)
                                            </span>
                                            <span style={{ fontSize: '1.2rem' }}>
                                                {getActivityTypesSummary(template)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            borderTop: '1px solid #f0f0f0',
                                            paddingTop: '15px'
                                        }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/templates/${template._id}/edit`);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    background: '#f5f5f5',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: '#666',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDuplicate(template);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    background: '#f5f5f5',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: '#666',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                📋 Duplicar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(template._id);
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: '#fff5f5',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: '#dc3545',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TemplatesPage;
