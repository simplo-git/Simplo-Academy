import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/HomePage.css'; // Reusing layout styles

const UserRegisterPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID for edit mode
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        foto: '',
        nome: '',
        setor: '',
        cargo: '',
        dt_adminisao: '',
        phone: '',
        nivel: 'Nível 01',
        tipo: 'colaborador',
        status: 'ativo',
        email: '',
        password: '',
        certificados: [],
        conteudos: []
    });
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [roles, setRoles] = useState([]);
    const [availableCerts, setAvailableCerts] = useState([]);
    const [selectedCert, setSelectedCert] = useState('');
    const [certDate, setCertDate] = useState('');
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchCertificates();
        if (isEditMode) {
            fetchUser();
        }
    }, [id]);

    const fetchRoles = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (err) {
            console.error('Erro ao buscar setores:', err);
        }
    };

    const fetchCertificates = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/certificates');
            if (response.ok) {
                const data = await response.json();
                setAvailableCerts(data);
            }
        } catch (err) {
            console.error('Erro ao buscar certificados:', err);
        }
    };


    const fetchUser = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/users/${id}`);
            if (response.ok) {
                const data = await response.json();
                // Format date for input: YYYY-MM-DD
                let formattedDate = '';
                if (data.dt_adminisao) {
                    formattedDate = new Date(data.dt_adminisao).toISOString().split('T')[0];
                }
                setFormData({
                    ...data,
                    dt_adminisao: formattedDate,
                    password: '',
                    foto: data.foto || '',
                    certificados: data.certificados || [],
                    conteudos: data.conteudos || [],
                    nivel: data.nivel || 'Nível 01',
                    tipo: data.tipo || 'colaborador',
                    status: data.status || 'ativo',
                    setor: typeof data.setor === 'object' && data.setor ? data.setor._id : (data.setor || '')
                }); // Don't show hash
                setPreview(data.foto);
            } else {
                setError('Erro ao carregar dados do usuário');
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress to JPEG 70% quality
                    setPreview(dataUrl);
                    setFormData(prev => ({ ...prev, foto: dataUrl }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddCertificate = () => {
        if (!selectedCert || !certDate) {
            alert('Selecione um certificado e a data de conclusão.');
            return;
        }

        const newCert = {
            certificate: selectedCert, // Save ID
            data_conclusao: certDate
        };

        // Prevent duplicates (optional, but good UX)
        if (formData.certificados.some(c => c.certificate === selectedCert)) {
            alert('Este certificado já foi adicionado.');
            return;
        }

        setFormData(prev => ({
            ...prev,
            certificados: [...prev.certificados, newCert]
        }));

        setSelectedCert('');
        setCertDate('');
    };

    const handleRemoveCertificate = (certId) => {
        setFormData(prev => ({
            ...prev,
            certificados: prev.certificados.filter(c => c.certificate !== certId)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const url = isEditMode
            ? `http://127.0.0.1:5000/api/users/${id}`
            : 'http://127.0.0.1:5000/api/users';

        const method = isEditMode ? 'PUT' : 'POST';

        // Remove password if empty in edit mode
        const payload = {
            ...formData,
            foto: formData.foto ?? '',   // garante string
            certificados: Array.isArray(formData.certificados) ? formData.certificados : [],
            conteudos: Array.isArray(formData.conteudos) ? formData.conteudos : [],
            nivel: formData.nivel || 'Nível 01',
            tipo: formData.tipo || 'colaborador',
            status: formData.status || 'ativo'
        };

        // Remove system fields that should not be sent
        delete payload._id;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.__v;

        if (isEditMode && !payload.password) {
            delete payload.password;
        }

        console.log('[DEBUG] Clean Payload:', payload);

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(isEditMode ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
                setTimeout(() => navigate('/users'), 1500);
            } else {
                setError(data.message || 'Erro ao salvar usuário');
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão com o servidor');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        margin: '5px 0 15px 0',
        borderRadius: '4px',
        border: '1px solid #ddd',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '500',
        color: '#333'
    };

    return (
        <div className="home-container">
            <Header />
            <main className="main-content">
                <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2d3e50' }}>{isEditMode ? 'Editar Usuário' : 'Novo Usuário'}</h2>

                    {error && <p style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px' }}>{error}</p>}
                    {success && <p style={{ color: 'green', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px' }}>{success}</p>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Left Column */}
                            <div>
                                <div>
                                    <label style={labelStyle}>Nome Completo</label>
                                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Telefone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Data de Admissão</label>
                                    <input type="date" name="dt_adminisao" value={formData.dt_adminisao} onChange={handleChange} required style={inputStyle} />
                                </div>

                                {/* Photo Upload Section */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelStyle}>Foto do Perfil</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            backgroundColor: '#eee',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #ddd'
                                        }}>
                                            {preview ? (
                                                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ color: '#888', fontSize: '24px' }}>📷</span>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <input type="hidden" name="foto" value={formData.foto} />

                                    <button
                                        type="button"
                                        onClick={() => setIsCertModalOpen(true)}
                                        style={{
                                            marginTop: '15px',
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span>🏅</span> Gerenciar Certificações
                                    </button>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div>
                                <div>
                                    <label style={labelStyle}>Setor</label>
                                    <select name="setor" value={formData.setor} onChange={handleChange} required style={inputStyle}>
                                        <option value="">Selecione um setor...</option>
                                        {roles.map(role => (
                                            <option key={role._id} value={role._id}>
                                                {role.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Cargo</label>
                                    <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Nível</label>
                                    <select name="nivel" value={formData.nivel} onChange={handleChange} style={inputStyle}>
                                        <option value="Nível 01">Nível 01</option>
                                        <option value="Nível 02">Nível 02</option>
                                        <option value="Qualificado">Qualificado</option>
                                        <option value="Específico">Específico</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Tipo de Acesso</label>
                                    <select name="tipo" value={formData.tipo} onChange={handleChange} style={inputStyle}>
                                        <option value="colaborador">Colaborador</option>
                                        <option value="administrador">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                                {/* Removed inline certificate section */}
                                <div>
                                    <label style={labelStyle}>Senha {isEditMode && '(Deixe em branco para manter)'}</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} style={inputStyle} />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}
                            >
                                {isEditMode ? 'Salvar Alterações' : 'Salvar Usuário'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/users')}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#ddd',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Certificate Management Modal */}
            {isCertModalOpen && (
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
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Gerenciar Certificações</h3>
                            <button
                                onClick={() => setIsCertModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Add New Certificate Section */}
                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '0.9rem' }}>Adicionar Nova</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <select
                                    value={selectedCert}
                                    onChange={(e) => setSelectedCert(e.target.value)}
                                    style={inputStyle}
                                >
                                    <option value="">Selecione um certificado...</option>
                                    {availableCerts.map(cert => (
                                        <option key={cert._id} value={cert._id}>{cert.nome}</option>
                                    ))}
                                </select>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="date"
                                        value={certDate}
                                        onChange={(e) => setCertDate(e.target.value)}
                                        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCertificate}
                                        style={{
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '10px 20px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List of Assigned Certificates */}
                        <div>
                            <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '0.9rem' }}>Certificações Atribuídas: {formData.certificados?.length || 0}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {formData.certificados && formData.certificados.length > 0 ? (
                                    formData.certificados.map((certItem, index) => {
                                        const certDetails = availableCerts.find(c => c._id === certItem.certificate);
                                        return (
                                            <div key={index} style={{
                                                border: '1px solid #ddd',
                                                borderRadius: '6px',
                                                padding: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                backgroundColor: 'white'
                                            }}>
                                                {certDetails?.link ? (
                                                    <img src={certDetails.link} alt="Badge" style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '50px', height: '50px', borderRadius: '4px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏆</div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold' }}>{certDetails?.nome || 'Desconhecido'}</div>
                                                    <div style={{ fontSize: '0.85em', color: '#666' }}>Concluído em: {certItem.data_conclusao}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCertificate(certItem.certificate)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc3545',
                                                        cursor: 'pointer',
                                                        padding: '5px'
                                                    }}
                                                    title="Remover"
                                                >
                                                    <span style={{ fontSize: '1.2rem' }}>🗑️</span>
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ color: '#888', textAlign: 'center', fontStyle: 'italic' }}>Nenhuma certificação atribuída.</p>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button
                                type="button"
                                onClick={() => setIsCertModalOpen(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Concluído
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserRegisterPage;
