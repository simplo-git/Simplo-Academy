import React, { useState, useEffect } from 'react';
import '../css/ContentWizard.css';

const STEPS = [
    { id: 1, label: 'Dados Cadastrais' },
    { id: 2, label: 'Templates' },
    { id: 3, label: 'Nível' },
    { id: 4, label: 'Usuários' },
    { id: 5, label: 'Correção' },
    { id: 6, label: 'Certificado' }
];

const ContentWizard = ({ onClose, onSuccess, initialData }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Data State
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        setores: [], // Changed from 'setor' string to array of IDs
        conteudos: [], // Lista de IDs de templates
        nivel: 1,
        usuarios: {}, // Dict[id, {realizado, nota, ...}]
        correcao: 'manual', // default
        certificado_id: null // Opcional
    });

    // Fetched Data
    const [templates, setTemplates] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]); // New state for roles/sectors
    const [certificates, setCertificates] = useState([]); // New state for certificates
    const [loadingData, setLoadingData] = useState(false);

    // Initial Data Effect
    useEffect(() => {
        if (initialData) {
            // Helper to extract IDs from various formats (array of strings, array of objects with _id or id)
            const extractIds = (list) => {
                if (!list || !Array.isArray(list)) return [];
                return list.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return item._id || item.id;
                    }
                    return item;
                }).filter(Boolean); // Remove null/undefined
            };

            const mappedSetores = extractIds(initialData.setores || initialData.setor);

            setFormData({
                nome: initialData.nome || '',
                descricao: initialData.descricao || '',
                setores: mappedSetores,
                conteudos: initialData.conteudos ? extractIds(initialData.conteudos) : [],
                nivel: initialData.nivel || 1,
                usuarios: initialData.usuarios || {},
                correcao: initialData.correcao || 'manual',
                certificado_id: initialData.certificado_id || null
            });
        }
    }, [initialData]);

    // Fetch Templates, Users, Roles, and Certificates on mount
    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true);
            try {
                // Fetch Templates
                const tRes = await fetch('http://127.0.0.1:5000/api/activity-templates');
                if (tRes.ok) setTemplates(await tRes.json());

                // Fetch Users
                const uRes = await fetch('http://127.0.0.1:5000/api/users');
                if (uRes.ok) setUsers(await uRes.json());

                // Fetch Roles (Setores)
                const rRes = await fetch('http://127.0.0.1:5000/api/roles');
                if (rRes.ok) setRoles(await rRes.json());

                // Fetch Certificates
                const cRes = await fetch('http://127.0.0.1:5000/api/certificates');
                if (cRes.ok) setCertificates(await cRes.json());

            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    // Auto-Select Users based on Level and Sectors
    useEffect(() => {
        // Only run auto-select logic if NOT in edit mode OR if explicitly changing steps/level
        // Ideally, we don't want to overwrite existing user selections in edit mode unless the user changes sectors/level
        // But for simplicity, we let the user modify manually if needed.

        if (currentStep === 4 && !initialData) { // Added !initialData check to prevent overwriting on load
            const filteredUsers = users.filter(u => formData.setores.includes(u.setor));

            if (formData.nivel === 1 || formData.nivel === 2) {
                // Auto-select ALL available users in the filtered sectors
                const allSelected = {};
                filteredUsers.forEach(u => {
                    allSelected[u._id] = { realizado: false, nota: null };
                });

                // Only update if looks different to avoid loops (or just set it, React batches)
                if (Object.keys(formData.usuarios).length !== filteredUsers.length) {
                    setFormData(prev => ({ ...prev, usuarios: allSelected }));
                }
            } else {
                // Lvl 3/4: System asks (= manual). Ensure we don't carry over auto-selected ones if moving from Lvl 1->3
                // We'll reset if it matches the full list (heuristic for auto-selected)
                if (Object.keys(formData.usuarios).length === filteredUsers.length && filteredUsers.length > 0) {
                    // Check if not empty before clearing
                    if (Object.keys(formData.usuarios).length > 0)
                        setFormData(prev => ({ ...prev, usuarios: {} }));
                }
            }
        }
    }, [currentStep, formData.nivel, formData.setores, users, initialData]);

    // Validate Correction Type
    useEffect(() => {
        const selectedTemplates = templates.filter(t => formData.conteudos.includes(t._id));
        const hasManualActivity = selectedTemplates.some(t => ['texto_livre', 'upload'].includes(t.tipo));

        if (hasManualActivity && formData.correcao === 'automatica') {
            setFormData(prev => ({ ...prev, correcao: 'manual' }));
        }
    }, [formData.conteudos, formData.correcao, templates]);

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const url = initialData
                ? `http://127.0.0.1:5000/api/conteudos/${initialData._id}`
                : 'http://127.0.0.1:5000/api/conteudos';

            const method = initialData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSuccess(); // Close and Refresh
                onClose();
            } else {
                const errData = await response.json();
                alert(`Erro ao ${initialData ? 'atualizar' : 'criar'} conteúdo: ${errData.message || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao salvar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Helpers ---

    const renderStep1 = () => (
        <div className="step-content">
            <div className="form-group">
                <label className="form-label">Nome do Conteúdo</label>
                <input
                    className="form-input"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Treinamento de Segurança"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                    className="form-textarea"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o objetivo deste conteúdo..."
                />
            </div>
            <div className="form-group">
                <label className="form-label">Setores Relacionados</label>
                {loadingData ? <p>Carregando setores...</p> : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {roles.map(role => {
                            const isSelected = formData.setores.includes(role._id);
                            return (
                                <div
                                    key={role._id}
                                    onClick={() => {
                                        const newSetores = isSelected
                                            ? formData.setores.filter(id => id !== role._id)
                                            : [...formData.setores, role._id];
                                        setFormData({ ...formData, setores: newSetores });
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: `1px solid ${isSelected ? '#007bff' : '#ddd'}`,
                                        backgroundColor: isSelected ? '#e3f2fd' : 'white',
                                        color: isSelected ? '#007bff' : '#555',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: isSelected ? '600' : '400',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {isSelected && <span>✓</span>}
                                    {role.nome}
                                </div>
                            );
                        })}
                    </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#888' }}>
                    Selecione um ou mais setores que terão acesso a este conteúdo.
                </div>
            </div>
        </div>
    );


    const renderStep2 = () => {
        // Helper to find template by ID
        const getTemplate = (id) => templates.find(t => t._id === id);

        const toggleTemplate = (id) => {
            const isSelected = formData.conteudos.includes(id);
            if (isSelected) {
                // Remove
                setFormData({
                    ...formData,
                    conteudos: formData.conteudos.filter(tid => tid !== id)
                });
            } else {
                // Add to end
                setFormData({
                    ...formData,
                    conteudos: [...formData.conteudos, id]
                });
            }
        };

        const moveTemplate = (index, direction) => {
            const newOrder = [...formData.conteudos];
            if (direction === -1 && index > 0) { // Up
                [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            } else if (direction === 1 && index < newOrder.length - 1) { // Down
                [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            }
            setFormData({ ...formData, conteudos: newOrder });
        };

        // Helper to get icon by type
        const getTemplateIcon = (type) => {
            switch (type) {
                case 'video': return '🎥';
                case 'quiz':
                case 'multipla_escolha': return '📝';
                case 'texto_livre': return '✍️';
                case 'upload': return '📤';
                case 'artigo':
                case 'conteudo': return '📰';
                case 'link': return '🔗';
                default: return '📄';
            }
        };

        return (
            <div className="step-content">
                <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
                    {/* Left: Available */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ color: '#555', marginBottom: '10px' }}>Templates Disponíveis</h4>
                        <div className="selection-grid" style={{ overflowY: 'auto', maxHeight: '400px', alignContent: 'start' }}>
                            {loadingData ? <p>Carregando...</p> : (
                                templates
                                    .filter(t => !formData.conteudos.includes(t._id))
                                    .map(t => (
                                        <div
                                            key={t._id}
                                            className="selection-card"
                                            onClick={() => toggleTemplate(t._id)}
                                            style={{ padding: '12px' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ fontSize: '1.5rem' }}>{getTemplateIcon(t.tipo)}</div>
                                                <div>
                                                    <div className="card-title" style={{ fontSize: '0.9rem' }}>{t.nome}</div>
                                                    <div className="card-subtitle" style={{ fontSize: '0.8rem' }}>{t.atividades?.length || 0} atividades</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Right: Selected (Ordered) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #eee', paddingLeft: '2rem' }}>
                        <h4 style={{ color: '#007bff', marginBottom: '10px' }}>
                            Ordem de Exibição ({formData.conteudos.length})
                        </h4>
                        <div style={{ overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {formData.conteudos.length === 0 && (
                                <p style={{ color: '#999', fontStyle: 'italic' }}>Nenhum template selecionado</p>
                            )}
                            {formData.conteudos.map((id, index) => {
                                const t = getTemplate(id);
                                if (!t) return null;
                                return (
                                    <div key={id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px',
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: '#007bff',
                                                backgroundColor: '#e3f2fd',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                fontSize: '0.8rem'
                                            }}>
                                                {index + 1}
                                            </span>
                                            <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{t.nome}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                onClick={() => moveTemplate(index, -1)}
                                                disabled={index === 0}
                                                style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                                            >
                                                ⬆️
                                            </button>
                                            <button
                                                onClick={() => moveTemplate(index, 1)}
                                                disabled={index === formData.conteudos.length - 1}
                                                style={{ border: 'none', background: 'none', cursor: index === formData.conteudos.length - 1 ? 'default' : 'pointer', opacity: index === formData.conteudos.length - 1 ? 0.3 : 1 }}
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                onClick={() => toggleTemplate(id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545', marginLeft: '8px' }}
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep3 = () => {
        const levels = [
            { val: 1, label: 'Nível 1' },
            { val: 2, label: 'Nível 2' },
            { val: 3, label: 'Qualificado' },
            { val: 4, label: 'Específico' }
        ];

        return (
            <div className="step-content">
                <h3 style={{ marginBottom: '20px', color: '#333' }}>Defina o Nível de Dificuldade</h3>
                <div className="level-selector">
                    {levels.map(lvl => (
                        <div
                            key={lvl.val}
                            className={`level-option ${formData.nivel === lvl.val ? 'selected' : ''}`}
                            onClick={() => setFormData({ ...formData, nivel: lvl.val })}
                        >
                            <span className="level-number">{lvl.val}</span>
                            <span className="level-desc">{lvl.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };



    const renderStep4 = () => {
        // Filter users by selected sectors
        const filteredUsers = users.filter(u => formData.setores.includes(u.setor));
        const selectedUserIds = Object.keys(formData.usuarios);
        const selectedUsersList = users.filter(u => selectedUserIds.includes(u._id));

        return (
            <div className="step-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Selecione os Usuários</h3>
                    <div style={{ fontSize: '0.9rem', color: '#666', backgroundColor: '#f0f0f0', padding: '5px 10px', borderRadius: '4px' }}>
                        {formData.nivel <= 2 && !initialData
                            ? "✅ Seleção Automática (Todos do Setor)"
                            : "👆 Seleção Manual (ou herdada)"}
                    </div>
                </div>

                {/* VISUALIZAÇÃO DOS SELECIONADOS */}
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #90caf9' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#0d47a1', fontSize: '1rem' }}>
                        Usuários Selecionados ({selectedUsersList.length})
                    </h4>
                    {selectedUsersList.length === 0 ? (
                        <p style={{ margin: 0, color: '#555', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum usuário selecionado.</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {selectedUsersList.map(u => (
                                <div key={u._id} style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    backgroundColor: 'white', padding: '4px 8px', borderRadius: '16px',
                                    border: '1px solid #bbdefb', fontSize: '0.85rem', color: '#0d47a1'
                                }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#eee', overflow: 'hidden' }}>
                                        {u.foto ? <img src={u.foto} alt="" style={{ width: '100%', height: '100%' }} /> : <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '0.6rem' }}>{u.nome.charAt(0)}</span>}
                                    </div>
                                    <span>{u.nome}</span>
                                    <button
                                        onClick={() => {
                                            const newUsuarios = { ...formData.usuarios };
                                            delete newUsuarios[u._id];
                                            setFormData({ ...formData, usuarios: newUsuarios });
                                        }}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d32f2f', marginLeft: '4px', padding: 0, fontSize: '1rem', lineHeight: 1 }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <h4 style={{ marginTop: '0', marginBottom: '10px', color: '#555', fontSize: '0.95rem' }}>Disponíveis nos Setores Selecionados</h4>

                {filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888', border: '1px dashed #ddd', borderRadius: '8px' }}>
                        <p>Nenhum usuário encontrado nos setores selecionados.</p>
                        <small>Volte ao passo 1 para ajustar os setores.</small>
                    </div>
                ) : (
                    <div className="user-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', overflowY: 'auto', maxHeight: '300px' }}>
                        {filteredUsers.map(u => {
                            const isSelected = !!formData.usuarios[u._id];
                            return (
                                <div
                                    key={u._id}
                                    onClick={() => {
                                        // Toggle selection
                                        const newUsuarios = { ...formData.usuarios };
                                        if (isSelected) {
                                            delete newUsuarios[u._id];
                                        } else {
                                            newUsuarios[u._id] = { realizado: false, nota: null };
                                        }
                                        setFormData({ ...formData, usuarios: newUsuarios });
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: `1px solid ${isSelected ? '#007bff' : '#eee'}`,
                                        backgroundColor: isSelected ? '#e3f2fd' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: isSelected ? 0.7 : 1 // Dim selected in grid since they are shown above
                                    }}
                                >
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ddd',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px',
                                        overflow: 'hidden'
                                    }}>
                                        {u.foto ? <img src={u.foto} alt="" style={{ width: '100%', height: '100%' }} /> : u.nome.charAt(0)}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nome}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{u.cargo || 'Colaborador'}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#888', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                                            {u.nivel || 'Nível 1'}
                                        </span>
                                        {isSelected && <div style={{ color: '#007bff' }}>✓</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {formData.nivel <= 2 && !initialData && (
                    <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#0056b3', backgroundColor: '#d1ecf1', padding: '10px', borderRadius: '4px' }}>
                        ℹ️ Como o nível selecionado é {formData.nivel === 1 ? '1' : '2'} (Básico), todos os usuários elegíveis foram pré-selecionados.
                    </div>
                )}
            </div>
        );
    };

    const renderStep5 = () => {
        const selectedTemplates = templates.filter(t => formData.conteudos.includes(t._id));
        const hasManualActivity = selectedTemplates.some(t => ['texto_livre', 'upload'].includes(t.tipo));

        return (
            <div className="step-content">
                <h3 style={{ marginBottom: '20px', color: '#333' }}>Tipo de Correção</h3>

                {hasManualActivity && (
                    <div style={{ marginBottom: '15px', color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', fontSize: '0.9rem' }}>
                        ⚠️ A correção automática está indisponível porque você selecionou templates manuais (Texto Livre ou Upload).
                    </div>
                )}

                <div className="correction-options">
                    <div
                        className={`correction-card ${formData.correcao === 'manual' ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, correcao: 'manual' })}
                    >
                        <span className="correction-icon">✍️</span>
                        <div className="correction-title">Manual</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            Instrutores corrigem as atividades manualmente.
                        </div>
                    </div>
                    <div
                        className={`correction-card ${formData.correcao === 'automatica' ? 'selected' : ''}`}
                        onClick={() => {
                            if (!hasManualActivity) {
                                setFormData({ ...formData, correcao: 'automatica' });
                            }
                        }}
                        style={hasManualActivity ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#f9f9f9' } : {}}
                    >
                        <span className="correction-icon">🤖</span>
                        <div className="correction-title">Automática</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            O sistema corrige automaticamente (ideal para múltipla escolha e conteúdo).
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep6 = () => (
        <div className="step-content">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Selecione o Certificado (Opcional)</h3>
            <div className="selection-grid">
                {/* Option for No Certificate */}
                <div
                    className={`selection-card ${formData.certificado_id === null ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, certificado_id: null })}
                    style={{ borderStyle: 'dashed' }}
                >
                    <div className="card-icon">🚫</div>
                    <div className="card-title">Sem Certificado</div>
                </div>

                {/* Available Certificates */}
                {certificates.map(cert => (
                    <div
                        key={cert._id}
                        className={`selection-card ${formData.certificado_id === cert._id ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, certificado_id: cert._id })}
                    >
                        {cert.insignia ? (
                            <img
                                src={cert.insignia}
                                alt={cert.nome}
                                style={{ width: '50px', height: '50px', objectFit: 'contain', marginBottom: '10px' }}
                            />
                        ) : (
                            <div className="card-icon">🎓</div>
                        )}
                        <div className="card-title">{cert.nome}</div>
                        <div className="card-subtitle">{cert.nivel ? `Nível ${cert.nivel}` : ''}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Determines validity of current step (simple validation)
    const isStepValid = () => {
        if (currentStep === 1) return formData.nome.length > 3 && formData.descricao.length > 5;
        if (currentStep === 2) return formData.conteudos.length > 0;
        return true; // Other steps have defaults or are optional selections
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-container">
                {/* Header */}
                <div className="wizard-header">
                    <h2 className="wizard-title">{initialData ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}</h2>
                    <button className="wizard-close" onClick={onClose} title="Fechar">×</button>
                </div>

                {/* Progress Bar */}
                <div className="wizard-progress">
                    <div className="progress-line"></div>
                    {STEPS.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        return (
                            <div key={step.id} className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="step-number">{isCompleted ? '✓' : step.id}</div>
                                <div className="step-label">{step.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="wizard-body">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                    {currentStep === 6 && renderStep6()}
                </div>

                {/* Footer */}
                <div className="wizard-footer">
                    <button
                        className="btn-secondary"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                    >
                        Voltar
                    </button>
                    {currentStep === STEPS.length ? (
                        <button
                            className="btn-primary btn-success"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Conteúdo')}
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={handleNext}
                            disabled={!isStepValid()}
                        >
                            Próximo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentWizard;
