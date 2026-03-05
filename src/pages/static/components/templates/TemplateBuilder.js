import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser } from '../../../../auth/auth';
import MultiplaEscolhaTemplate from './types/MultiplaEscolhaTemplate';
import VideoTemplate from './types/VideoTemplate';
import TextoLivreTemplate from './types/TextoLivreTemplate';
import UploadTemplate from './types/UploadTemplate';
import DocumentoTemplate from './types/DocumentoTemplate';
import ArtigoTemplate from './types/ArtigoTemplate';
import './TemplateBuilder.css';

const TemplateBuilder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [templateData, setTemplateData] = useState({
        nome: '',
        tipo: 'multipla_escolha',
        setor: '', // Added setor
        descricao: '',
        template: {} // Dados da atividade única
    });
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState([]);

    const currentUser = getUser();
    const isAdmin = currentUser?.setor === '69a883924e36d6b21869b0ed';

    const activityTypes = [
        { tipo: 'multipla_escolha', label: 'Múltipla Escolha', icon: '❓' },
        { tipo: 'video', label: 'Vídeo', icon: '🎬' },
        { tipo: 'texto_livre', label: 'Texto Livre', icon: '📝' },
        { tipo: 'upload', label: 'Upload', icon: '📤' },
        { tipo: 'documento', label: 'Documento', icon: '📄' },
        { tipo: 'artigo', label: 'Artigo', icon: '📰' }
    ];

    const getDefaultDataForType = (tipo) => {
        switch (tipo) {
            case 'multipla_escolha':
                return {
                    questoes: [
                        {
                            pergunta: '',
                            opcoes: [
                                { texto: '', correta: false },
                                { texto: '', correta: false }
                            ]
                        }
                    ],
                    obrigatorio: true
                };
            case 'video':
                return { titulo: '', arquivo: null, nomeArquivo: null, tipoArquivo: null, tamanhoArquivo: null, descricao: '', obrigatorio: false };
            case 'texto_livre':
                return { enunciado: '', minCaracteres: '', maxCaracteres: '', orientacoes: '', obrigatorio: false };
            case 'upload':
                return { titulo: '', instrucoes: '', tiposAceitos: ['pdf'], tamanhoMaximo: 10, obrigatorio: false };
            case 'documento':
                return { titulo: '', descricao: '', arquivo: null, nomeArquivo: null, tipoArquivo: null, tamanhoArquivo: null, permitirDownload: true, obrigatorio: false };
            case 'artigo':
                return { titulo: '', conteudo: '', tempoLeitura: '', autor: '', obrigatorio: false };
            default:
                return {};
        }
    };

    // Fetch template if editing
    useEffect(() => {
        fetchRoles();
        if (isEditing) {
            fetchTemplate();
        } else {
            // Set default data for initial type
            setTemplateData(prev => ({
                ...prev,
                template: getDefaultDataForType(prev.tipo),
                setor: currentUser?.setor && !isAdmin ? currentUser.setor : '' // Default to user's sector if not Admin
            }));
        }
    }, [id]);

    const fetchRoles = async () => {
        try {
            const response = await fetch('http://192.168.0.17:9000/api/roles');
            if (response.ok) {
                const data = await response.json();
                if (isAdmin) {
                    setRoles(data);
                } else if (currentUser?.setor) {
                    setRoles(data.filter(r => r._id === currentUser.setor));
                    // Ensure templateData visually updates to the current user's sector if it's empty
                    setTemplateData(prev => {
                        if (!prev.setor && !isEditing) {
                            return { ...prev, setor: currentUser.setor };
                        }
                        return prev;
                    });
                }
            }
        } catch (err) {
            console.error('Erro ao carregar roles:', err);
        }
    };


    const fetchTemplate = async () => {
        try {
            const response = await fetch(`http://192.168.0.17:9000/api/activity-templates/${id}`);
            if (response.ok) {
                const data = await response.json();

                // Logic to handle nested dados (if backend saved it nested inside template)
                // or standard structure (template is the data object)
                const rawTemplate = data.template || {};
                const effectiveTemplate = rawTemplate.dados || rawTemplate || getDefaultDataForType(data.tipo || 'multipla_escolha');

                setTemplateData({
                    nome: data.nome || '',
                    tipo: data.tipo || 'multipla_escolha',
                    setor: typeof data.setor === 'object' ? data.setor._id || data.setor.id : data.setor || '',
                    descricao: data.descricao || '',
                    template: effectiveTemplate
                });
            }
        } catch (err) {
            console.error('Erro ao carregar template:', err);
        }
    };

    // Handle type change - reset dados with defaults for new type
    const handleTypeChange = (newTipo) => {
        setTemplateData(prev => ({
            ...prev,
            tipo: newTipo,
            template: getDefaultDataForType(newTipo)
        }));
    };

    // Update activity data
    const updateActivityData = (index, data) => {
        setTemplateData(prev => ({
            ...prev,
            template: data
        }));
    };

    // Render the activity form based on type
    const renderActivityForm = () => {
        const props = {
            data: templateData.template,
            onChange: updateActivityData,
            onRemove: null, // No remove for single activity
            index: 0,
            hideRemove: true // Flag to hide remove button
        };

        switch (templateData.tipo) {
            case 'multipla_escolha':
                return <MultiplaEscolhaTemplate {...props} />;
            case 'video':
                return <VideoTemplate {...props} />;
            case 'texto_livre':
                return <TextoLivreTemplate {...props} />;
            case 'upload':
                return <UploadTemplate {...props} />;
            case 'documento':
                return <DocumentoTemplate {...props} />;
            case 'artigo':
                return <ArtigoTemplate {...props} />;
            default:
                return null;
        }
    };

    const handleSave = async () => {
        if (!templateData.nome.trim()) {
            alert('Por favor, adicione um nome ao template.');
            return;
        }

        // Ensure sector is set for non-admins if it's empty
        let finalSetor = templateData.setor;
        if (!isAdmin && !finalSetor && currentUser?.setor) {
            finalSetor = currentUser.setor;
        }

        setSaving(true);
        try {
            // Determine API URL and Method
            let url = 'http://192.168.0.17:9000/api/activity-templates';
            let method = 'POST';

            // Check if we need to use the upload route
            // The upload route is specifically for creating templates with file upload (video/document)
            // It expects the base64 file in data.template.arquivo
            const hasFileUpload = templateData.template && templateData.template.arquivo;

            if (hasFileUpload && isEditing) {
                // UPDATE with upload
                url = `http://192.168.0.17:9000/api/activity-templates/video-upload/${id}`;
                method = 'PUT';
            } else if (hasFileUpload) {
                // CREATE with upload
                url = 'http://192.168.0.17:9000/api/activity-templates/video-upload';
                method = 'POST';
            } else if (isEditing) {
                // UPDATE standard
                url = `${url}/${id}`;
                method = 'PUT';
            }

            // Prepare payload
            // Backend might still expect 'atividades' array for standard POST route
            // We send BOTH 'dados' (new structure) and 'atividades' (old structure) for compatibility

            const payload = { ...templateData, setor: finalSetor };

            // If using the video-upload route, the backend EXPECTS 'dados'.
            if (url.includes('video-upload')) {
                payload.dados = payload.template;
                // Remove 'template' to prevent backend from seeing the base64 in dual places 
                // and throwing "BSON too large" error.
                delete payload.template;
            } else {
                // For standard POST creation (e.g. ActivityTemplate generic route)
                // the API might expect 'setor' in the base, and 'atividades' or 'dados' for the actual content.
                // We send it as 'template' which maps to 'dados' backend generally.
                // BUT we MUST make sure 'setor' is not lost. 
                // The current `payload` includes it because `templateData` does.
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                navigate('/templates');
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao salvar template');
            }
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro de conexão');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="template-builder">
            {/* Header */}
            <div className="builder-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/templates')}>
                        ← Voltar
                    </button>
                    <h1>{isEditing ? 'Editar Template' : 'Novo Template'}</h1>
                </div>
                <div className="header-actions">
                    <button className="btn-cancel" onClick={() => navigate('/templates')}>
                        Cancelar
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : '💾 Salvar Template'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="builder-content">
                {/* Template Header Card */}
                <div className="template-header-card">
                    <div className="header-accent"></div>
                    <div className="header-content">
                        <input
                            type="text"
                            className="template-title-input"
                            placeholder="Nome do Template"
                            value={templateData.nome}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, nome: e.target.value }))}
                        />
                        <div className="template-type-selector">
                            <label>Tipo de atividade:</label>
                            <select
                                value={templateData.tipo}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="tipo-select"
                            >
                                {activityTypes.map(type => (
                                    <option key={type.tipo} value={type.tipo}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="template-type-selector" style={{ marginTop: '15px' }}>
                            <label>Setor do Template:</label>
                            <select
                                value={templateData.setor}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, setor: e.target.value }))}
                                className="tipo-select"
                                disabled={!isAdmin}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    backgroundColor: !isAdmin ? '#f5f5f5' : 'white',
                                    cursor: !isAdmin ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isAdmin && <option value="">Sem setor específico (Global)</option>}
                                {roles.map(r => (
                                    <option key={r._id} value={r._id}>{r.nome}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* Single Activity Form */}
                <div className="activity-form-section">
                    {renderActivityForm()}
                </div>
            </div>
        </div>
    );
};

export default TemplateBuilder;
