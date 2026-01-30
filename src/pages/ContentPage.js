import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/HomePage.css'; // Reusing standard layout styles

const ContentPage = () => {
    const navigate = useNavigate();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContent, setEditingContent] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        tipo: 'video',
        url: '',
        duracao: ''
    });

    // Fetch Contents
    const fetchContents = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/contents');
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
    }, []);

    const handleOpenModal = (content = null) => {
        if (content) {
            setEditingContent(content);
            setFormData({
                titulo: content.titulo || '',
                descricao: content.descricao || '',
                tipo: content.tipo || 'video',
                url: content.url || '',
                duracao: content.duracao || ''
            });
        } else {
            setEditingContent(null);
            setFormData({ titulo: '', descricao: '', tipo: 'video', url: '', duracao: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContent(null);
        setFormData({ titulo: '', descricao: '', tipo: 'video', url: '', duracao: '' });
    };

    const handleOpenTemplateModal = () => {
        navigate('/templates');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingContent
            ? `http://127.0.0.1:5000/api/contents/${editingContent._id}`
            : 'http://127.0.0.1:5000/api/contents';
        const method = editingContent ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                handleCloseModal();
                fetchContents(); // Refresh list
            } else {
                alert('Erro ao salvar conteúdo');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este conteúdo?')) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/contents/${id}`, {
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
        const tipos = {
            'video': 'Vídeo',
            'documento': 'Documento',
            'imagem': 'Imagem',
            'link': 'Link Externo'
        };
        return tipos[tipo] || tipo;
    };

    return (
        <div className="home-container">
            <Header />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#333' }}>Adicionar Conteúdo</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                            + Adicionar
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
                            📋 Criar Templates
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
                                    <th style={{ padding: '15px' }}>Título</th>
                                    <th style={{ padding: '15px' }}>Tipo</th>
                                    <th style={{ padding: '15px' }}>Duração</th>
                                    <th style={{ padding: '15px', width: '150px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                            Nenhum conteúdo cadastrado.
                                        </td>
                                    </tr>
                                ) : (
                                    contents.map(content => (
                                        <tr key={content._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px' }}>{content.titulo}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: content.tipo === 'video' ? '#e3f2fd' :
                                                        content.tipo === 'documento' ? '#fff3e0' :
                                                            content.tipo === 'imagem' ? '#e8f5e9' : '#f3e5f5',
                                                    color: content.tipo === 'video' ? '#1976d2' :
                                                        content.tipo === 'documento' ? '#e65100' :
                                                            content.tipo === 'imagem' ? '#388e3c' : '#7b1fa2',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {getTipoLabel(content.tipo)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>{content.duracao || '-'}</td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => handleOpenModal(content)}
                                                    style={{ marginRight: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(content._id)}
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

                {/* Modal Adicionar/Editar Conteúdo */}
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
                            width: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ marginTop: 0 }}>{editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Título</label>
                                    <input
                                        type="text"
                                        value={formData.titulo}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
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
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descrição</label>
                                    <textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            boxSizing: 'border-box',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Tipo</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <option value="video">Vídeo</option>
                                        <option value="documento">Documento</option>
                                        <option value="imagem">Imagem</option>
                                        <option value="link">Link Externo</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>URL do Conteúdo</label>
                                    <input
                                        type="text"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        placeholder="https://..."
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Duração (ex: 10min, 1h)</label>
                                    <input
                                        type="text"
                                        value={formData.duracao}
                                        onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                                        placeholder="Ex: 30min"
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

export default ContentPage;
