import React, { useState, useEffect } from 'react';
import Header from './static/components/Header';
import './static/css/HomePage.css'; // Reusing standard layout styles

const CertificatesPage = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState(null);
    const [preview, setPreview] = useState('');
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conflictingCerts, setConflictingCerts] = useState([]);
    const [pendingSave, setPendingSave] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        insignia: '',
        carga_horaria: '',
        nivel: 1,
        relacionados: [],
        data_criacao: new Date().toISOString().split('T')[0]
    });

    // Fetch Certificates
    const fetchCertificates = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/certificates');
            if (response.ok) {
                const data = await response.json();
                setCertificates(data);
            } else {
                setError('Failed to fetch certificates');
            }
        } catch (err) {
            console.error(err);
            setError('Server connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const handleOpenModal = (cert = null) => {
        if (cert) {
            setEditingCertificate(cert);
            setFormData({
                nome: cert.nome || '',
                descricao: cert.descricao || '',
                insignia: cert.insignia || '',
                carga_horaria: cert.carga_horaria || '',
                nivel: cert.nivel || 1,
                relacionados: cert.relacionados || [],
                data_criacao: cert.data_criacao || new Date().toISOString().split('T')[0]
            });
            setPreview(cert.insignia || '');
        } else {
            setEditingCertificate(null);
            setFormData({
                nome: '',
                descricao: '',
                insignia: '',
                carga_horaria: '',
                nivel: 1,
                relacionados: [],
                data_criacao: new Date().toISOString().split('T')[0]
            });
            setPreview('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCertificate(null);
        setFormData({
            nome: '',
            descricao: '',
            insignia: '',
            carga_horaria: '',
            nivel: 1,
            relacionados: [],
            data_criacao: new Date().toISOString().split('T')[0]
        });
        setPreview('');
    };

    const processImage = (file) => {
        return new Promise((resolve, reject) => {
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

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const dataUrl = await processImage(file);
                setPreview(dataUrl);
                setFormData(prev => ({ ...prev, insignia: dataUrl }));
            } catch (err) {
                console.error('Error processing image:', err);
            }
        }
    };

    const handleMassUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const dataUrl = await processImage(file);
                const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

                const payload = {
                    nome: name,
                    descricao: '',
                    insignia: dataUrl,
                    carga_horaria: '',
                    nivel: 1,
                    relacionados: [],
                    data_criacao: new Date().toISOString().split('T')[0]
                };

                const response = await fetch('http://127.0.0.1:5000/api/certificates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
                errorCount++;
            }
        }

        setLoading(false);
        alert(`Upload concluído! Sucessos: ${successCount}, Erros: ${errorCount}`);
        fetchCertificates();
    };

    const saveCertificate = async () => {
        const url = editingCertificate
            ? `http://127.0.0.1:5000/api/certificates/${editingCertificate._id}`
            : 'http://127.0.0.1:5000/api/certificates';
        const method = editingCertificate ? 'PUT' : 'POST';

        // When creating, exclude relacionados since the certificate doesn't exist yet
        const payload = editingCertificate
            ? formData
            : { ...formData, relacionados: [] };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const savedCert = await response.json();
                const savedCertId = savedCert._id || editingCertificate?._id;

                // Bidirectional association: Update all related certificates to include each other
                if (formData.relacionados && formData.relacionados.length > 0) {
                    // Build the complete group: the saved certificate + all its related ones
                    const allRelatedIds = formData.relacionados.map(r => typeof r === 'object' ? r._id : r);
                    const groupIds = [savedCertId, ...allRelatedIds];

                    // For each certificate in the group, update its relacionados to include all others
                    for (const certId of allRelatedIds) {
                        const certToUpdate = certificates.find(c => c._id === certId);
                        if (certToUpdate) {
                            // Get existing relacionados (as IDs)
                            const existingRelated = (certToUpdate.relacionados || []).map(r =>
                                typeof r === 'object' ? r._id : r
                            );

                            // Build new relacionados: all group members except itself
                            const newRelated = [...new Set([...existingRelated, ...groupIds])].filter(id => id !== certId);

                            // Only update if there are changes
                            if (JSON.stringify(newRelated.sort()) !== JSON.stringify(existingRelated.sort())) {
                                await fetch(`http://127.0.0.1:5000/api/certificates/${certId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        nome: certToUpdate.nome,
                                        descricao: certToUpdate.descricao || '',
                                        insignia: certToUpdate.insignia || '',
                                        carga_horaria: certToUpdate.carga_horaria || '',
                                        nivel: certToUpdate.nivel || 1,
                                        relacionados: newRelated,
                                        data_criacao: certToUpdate.data_criacao || new Date().toISOString().split('T')[0]
                                    })
                                });
                            }
                        }
                    }
                }

                handleCloseModal();
                fetchCertificates(); // Refresh list
                setShowConflictModal(false);
                setConflictingCerts([]);
            } else {
                const data = await response.json();
                alert(data.message || 'Erro ao salvar certificado');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Identify selected related certificates objects
        const selectedRelated = certificates.filter(c =>
            formData.relacionados.some(r => (typeof r === 'object' ? r._id === c._id : r === c._id))
        );

        // Check for conflicts: related certs with SAME level as current OR with no level defined (blank/null/undefined)
        const conflicts = selectedRelated.filter(c =>
            c.nivel === formData.nivel || !c.nivel || c.nivel === null || c.nivel === undefined
        );

        if (conflicts.length > 0) {
            // Prepare conflicts for resolution
            // Default to a suggested level: if no level, suggest current+1. If same level, suggest current+1.
            // But cap at 3.
            const suggestedLevel = formData.nivel < 3 ? formData.nivel + 1 : formData.nivel;
            setConflictingCerts(conflicts.map(c => ({
                ...c,
                newLevel: c.nivel ? (c.nivel < 3 ? c.nivel + 1 : c.nivel) : suggestedLevel
            })));
            setShowConflictModal(true);
        } else {
            saveCertificate();
        }
    };

    const handleResolveConflicts = async () => {
        setLoading(true);
        setShowConflictModal(false);

        try {
            // STEP 1: Update levels of ALL conflicting certificates first
            console.log('Step 1: Updating conflicting certificate levels...');
            for (const cert of conflictingCerts) {
                const updatePayload = {
                    nome: cert.nome,
                    descricao: cert.descricao || '',
                    insignia: cert.insignia || '',
                    carga_horaria: cert.carga_horaria || '',
                    nivel: cert.newLevel, // Always use the new selected level
                    relacionados: cert.relacionados || [],
                    data_criacao: cert.data_criacao || new Date().toISOString().split('T')[0]
                };

                console.log(`Updating ${cert.nome} to level ${cert.newLevel}`);

                const response = await fetch(`http://127.0.0.1:5000/api/certificates/${cert._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to update certificate ${cert.nome}:`, errorText);
                    throw new Error(`Falha ao atualizar ${cert.nome}`);
                }
            }

            // STEP 2: Refresh the certificates list to get updated data
            console.log('Step 2: Refreshing certificates list...');
            const freshCertsResponse = await fetch('http://127.0.0.1:5000/api/certificates');
            const freshCerts = await freshCertsResponse.json();
            setCertificates(freshCerts);

            // STEP 3: Save the main certificate
            console.log('Step 3: Saving main certificate...');
            const url = editingCertificate
                ? `http://127.0.0.1:5000/api/certificates/${editingCertificate._id}`
                : 'http://127.0.0.1:5000/api/certificates';
            const method = editingCertificate ? 'PUT' : 'POST';

            const mainResponse = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!mainResponse.ok) {
                const errorData = await mainResponse.json();
                throw new Error(errorData.message || 'Erro ao salvar certificado');
            }

            const savedCert = await mainResponse.json();
            const savedCertId = savedCert._id || editingCertificate?._id;

            // STEP 4: Handle bidirectional associations
            console.log('Step 4: Updating bidirectional associations...');
            if (formData.relacionados && formData.relacionados.length > 0) {
                const allRelatedIds = formData.relacionados.map(r => typeof r === 'object' ? r._id : r);
                const groupIds = [savedCertId, ...allRelatedIds];

                // Use fresh certificates data for updates
                for (const certId of allRelatedIds) {
                    const certToUpdate = freshCerts.find(c => c._id === certId);
                    if (certToUpdate) {
                        const existingRelated = (certToUpdate.relacionados || []).map(r =>
                            typeof r === 'object' ? r._id : r
                        );

                        const newRelated = [...new Set([...existingRelated, ...groupIds])].filter(id => id !== certId);

                        if (JSON.stringify(newRelated.sort()) !== JSON.stringify(existingRelated.sort())) {
                            await fetch(`http://127.0.0.1:5000/api/certificates/${certId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    nome: certToUpdate.nome,
                                    descricao: certToUpdate.descricao || '',
                                    insignia: certToUpdate.insignia || '',
                                    carga_horaria: certToUpdate.carga_horaria || '',
                                    nivel: certToUpdate.nivel || 1,
                                    relacionados: newRelated,
                                    data_criacao: certToUpdate.data_criacao || new Date().toISOString().split('T')[0]
                                })
                            });
                        }
                    }
                }
            }

            // STEP 5: Final cleanup
            console.log('Step 5: Finalizing...');
            handleCloseModal();
            setConflictingCerts([]);
            fetchCertificates(); // Final refresh

        } catch (error) {
            console.error("Error in conflict resolution:", error);
            alert(error.message || "Erro ao processar certificados.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este certificado?')) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/certificates/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    fetchCertificates();
                } else {
                    alert('Erro ao excluir certificado');
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
                    <h2 style={{ color: '#333' }}>Gestão de Certificados</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleMassUpload}
                            style={{ display: 'none' }}
                            id="mass-upload-input"
                        />
                        <button
                            onClick={() => document.getElementById('mass-upload-input').click()}
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
                            Upload em Massa
                        </button>
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
                            + Adicionar Certificado
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
                                    <th style={{ padding: '15px' }}>Relacionados</th>
                                    <th style={{ padding: '15px' }}>Carga Horária</th>
                                    <th style={{ padding: '15px', width: '150px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certificates.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                            Nenhum certificado cadastrado.
                                        </td>
                                    </tr>
                                ) : (
                                    certificates.map(cert => (
                                        <tr key={cert._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {cert.insignia && (
                                                        <img
                                                            src={cert.insignia}
                                                            alt={cert.nome}
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                    )}
                                                    <span style={{ fontWeight: 'bold' }}>{cert.nome}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: cert.nivel === 1 ? '#e3f2fd' : cert.nivel === 2 ? '#fff3cd' : '#f8d7da',
                                                    color: cert.nivel === 1 ? '#0d47a1' : cert.nivel === 2 ? '#856404' : '#721c24',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {cert.nivel === 1 ? 'Básico' : cert.nivel === 2 ? 'Intermediário' : 'Avançado'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                {cert.relacionados && cert.relacionados.length > 0 ? (
                                                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                                                        {cert.relacionados.length} certificado(s)
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#aaa' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '15px' }}>{cert.carga_horaria}</td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => handleOpenModal(cert)}
                                                    style={{ marginRight: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cert._id)}
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
                            width: '500px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            <h3 style={{ marginTop: 0 }}>{editingCertificate ? 'Editar Certificado' : 'Novo Certificado'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nome do Certificado</label>
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
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descrição</label>
                                    <textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd',
                                            boxSizing: 'border-box',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Carga Horária (ex: 10h)</label>
                                        <input
                                            type="text"
                                            value={formData.carga_horaria}
                                            onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Imagem do Certificado</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '4px',
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
                                        <input type="hidden" name="insignia" value={formData.insignia} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nível</label>
                                    <select
                                        value={formData.nivel}
                                        onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ddd'
                                        }}
                                    >
                                        <option value={1}>1 - Básico</option>
                                        <option value={2}>2 - Intermediário</option>
                                        <option value={3}>3 - Avançado</option>
                                    </select>
                                </div>

                                {/* Certificados Relacionados: Only show when editing */}
                                {editingCertificate && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Certificados Relacionados</label>
                                        <div style={{
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            maxHeight: '100px',
                                            overflowY: 'auto',
                                            padding: '10px'
                                        }}>
                                            {certificates.filter(c => c._id !== editingCertificate?._id).map(cert => (
                                                <div key={cert._id} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`rel-${cert._id}`}
                                                        checked={formData.relacionados?.some(r => (typeof r === 'object' ? r._id === cert._id : r === cert._id))}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            let newRelated = [...(formData.relacionados || [])];
                                                            if (isChecked) {
                                                                newRelated.push(cert._id);
                                                            } else {
                                                                newRelated = newRelated.filter(id => (typeof id === 'object' ? id._id !== cert._id : id !== cert._id));
                                                            }
                                                            setFormData({ ...formData, relacionados: newRelated });
                                                        }}
                                                        style={{ marginRight: '8px' }}
                                                    />
                                                    <label htmlFor={`rel-${cert._id}`} style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
                                                        {cert.nome}
                                                    </label>
                                                </div>
                                            ))}
                                            {certificates.length <= 1 && (
                                                <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>Nenhum outro certificado disponível.</span>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                {/* Conflict Resolution Modal */}
                {showConflictModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1100 // Higher than form modal
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            width: '450px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#dc3545' }}>⚠️ Conflito de Níveis</h3>
                            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                                Os seguintes certificados relacionados possuem o <strong>mesmo nível ({formData.nivel})</strong> que o certificado atual.
                                Para manter a hierarquia, ajuste o nível deles abaixo:
                            </p>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                                {conflictingCerts.map((cert, index) => (
                                    <div key={cert._id} style={{
                                        padding: '10px',
                                        border: '1px solid #eee',
                                        borderRadius: '4px',
                                        marginBottom: '10px',
                                        backgroundColor: '#f9f9f9'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{cert.nome}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.9rem' }}>Novo Nível:</span>
                                            <select
                                                value={cert.newLevel}
                                                onChange={(e) => {
                                                    const newCerts = [...conflictingCerts];
                                                    newCerts[index].newLevel = parseInt(e.target.value);
                                                    setConflictingCerts(newCerts);
                                                }}
                                                style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                            >
                                                <option value={1}>1 - Básico</option>
                                                <option value={2}>2 - Intermediário</option>
                                                <option value={3}>3 - Avançado</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    onClick={() => setShowConflictModal(false)}
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
                                    onClick={handleResolveConflicts}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Atualizar e Salvar Todos
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
};

export default CertificatesPage;
