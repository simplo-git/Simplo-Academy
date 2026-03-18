import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/UserProfilePage.css';
import RelatedCertificatesModal from './static/components/RelatedCertificatesModal';
import { getUser } from '../auth/auth';

const UserProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isViewAllOpen, setIsViewAllOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const currentUser = getUser();
    const canEdit = currentUser && (currentUser._id === id || currentUser.id === id || currentUser.tipo === 'administrador');

    const fileInputRef = useRef(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAvatarHovered, setIsAvatarHovered] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch User
            const userRes = await fetch(`http://192.168.0.17:9000/api/users/${id}`);
            const userData = await userRes.json();

            // Fetch Certificates to get details (images)
            const certRes = await fetch('http://192.168.0.17:9000/api/certificates');
            const certData = await certRes.json();

            // Fetch Roles to get sector names
            const roleRes = await fetch('http://192.168.0.17:9000/api/roles');
            const roleData = await roleRes.json();

            // Enrich user certificates with details
            if (userData.certificados) {
                const enrichedCerts = userData.certificados.map(userCert => {
                    // Match by 'id' (new format) or 'certificate' (legacy format if exists)
                    const certId = userCert.id || userCert.certificate;
                    const details = certData.find(c => c._id === certId);
                    return { ...userCert, details };
                });
                userData.enrichedCertificates = enrichedCerts;
            } else {
                userData.enrichedCertificates = [];
            }

            setUser(userData);
            setCertificates(certData);
            setRoles(roleData);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Carregando...</div>;
    if (!user) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Usuário não encontrado</div>;

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Helper to get sector name
    const getSectorName = (sectorId) => {
        const role = roles.find(r => r._id === sectorId);
        return role ? role.nome : sectorId;
    };

    // Helper to format date (assuming UTC string or similar, fallback to today if missing)
    const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('pt-BR'); // Fallback

        // Ensure that strings like "2023-03-27" are not shifted backward 
        // to "26/03/2023" because of the local timezone offset (UTC-3 for BRT).
        // If it's pure YYYY-MM-DD, parsing it without timezone issues.
        const [year, month, day] = dateString.split('T')[0].split('-');
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }

        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Group certificates logic using Graph Connected Components
    const getGroupedCertificates = () => {
        if (!user || !user.enrichedCertificates) return [];

        const certs = user.enrichedCertificates;
        const adj = new Map(); // Adjacency list: id -> Set(ids)
        const idToCert = new Map();

        // Initialize graph
        certs.forEach(cert => {
            const certId = cert.id || cert.certificate;
            idToCert.set(certId, cert);
            if (!adj.has(certId)) adj.set(certId, new Set());

            // Add edges from relations
            if (cert.details?.relacionados && Array.isArray(cert.details.relacionados)) {
                cert.details.relacionados.forEach(rel => {
                    const relatedId = typeof rel === 'object' ? (rel._id || rel.id) : rel;
                    if (!relatedId) return;

                    // Check if the related cert is actually owned by the user
                    const relatedUserCert = certs.find(uc =>
                        uc.id === relatedId ||
                        uc.certificate === relatedId ||
                        (uc.details && uc.details._id === relatedId)
                    );

                    if (relatedUserCert) {
                        const relId = relatedUserCert.id || relatedUserCert.certificate;
                        // Add undirected edge (A -> B implies B -> A)
                        adj.get(certId).add(relId);

                        // Ensure other node exists in adj map if not already
                        if (!adj.has(relId)) adj.set(relId, new Set());
                        adj.get(relId).add(certId);
                    }
                });
            }
        });

        const visited = new Set();
        const groups = [];

        // DFS to find connected components
        const dfs = (currentId, currentGroup) => {
            visited.add(currentId);
            currentGroup.push(idToCert.get(currentId));

            const neighbors = adj.get(currentId) || new Set();
            for (const neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    dfs(neighborId, currentGroup);
                }
            }
        };

        // Iterate all nodes
        for (const [id] of idToCert) {
            if (!visited.has(id)) {
                const group = [];
                dfs(id, group);

                // Sort group by level descending
                group.sort((a, b) => (b.details?.nivel || 0) - (a.details?.nivel || 0));
                groups.push(group);
            }
        }

        return groups;
    };

    const groupedCertificates = getGroupedCertificates();

    const cleanPayload = (data) => {
        const payload = { ...data };
        delete payload._id;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.__v;
        delete payload.enrichedCertificates;
        if (typeof payload.setor === 'object' && payload.setor) {
            payload.setor = payload.setor._id || payload.setor.id || payload.setor;
        }
        if (!payload.certificados) payload.certificados = [];
        if (!payload.conteudos) payload.conteudos = [];
        return payload;
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                    setUser(prev => ({ ...prev, foto: dataUrl }));

                    const payload = cleanPayload({ ...user, foto: dataUrl });

                    try {
                        await fetch(`http://192.168.0.17:9000/api/users/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    } catch (error) {
                        console.error('Error updating photo:', error);
                        alert('Erro ao atualizar foto.');
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        const payload = cleanPayload({ ...user, password: newPassword });

        try {
            const res = await fetch(`http://192.168.0.17:9000/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Senha atualizada com sucesso!');
                setIsPasswordModalOpen(false);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert('Erro ao atualizar senha.');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            alert('Erro de conexão.');
        }
    };

    return (
        <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <Header />
            <main style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
            }}>
                {/* Card Container */}
                <div className="metallic-card" style={{
                    borderRadius: '20px',
                    width: '600px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '30px',
                    position: 'relative'
                }}>

                    {/* Discreed Edit Password Button */}
                    {canEdit && (
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            title="Alterar Senha"
                            style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                color: '#aaa',
                                transition: 'color 0.2s',
                                padding: '5px'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#555'}
                            onMouseLeave={(e) => e.target.style.color = '#aaa'}
                        >
                            🔒
                        </button>
                    )}

                    {/* Header Section: Avatar + Info */}
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        {/* Avatar */}
                        <div
                            onClick={() => canEdit && fileInputRef.current && fileInputRef.current.click()}
                            onMouseEnter={() => setIsAvatarHovered(true)}
                            onMouseLeave={() => setIsAvatarHovered(false)}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '3rem',
                                fontWeight: 'bold',
                                color: '#333',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                border: '1px solid #eee',
                                cursor: canEdit ? 'pointer' : 'default',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            title={canEdit ? "Alterar foto de perfil" : ""}
                        >
                            {user.foto ? (
                                <img src={user.foto} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                getInitials(user.nome)
                            )}
                            {canEdit && isAvatarHovered && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '35%',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    fontWeight: 'normal'
                                }}>
                                    Alterar
                                </div>
                            )}
                        </div>
                        {canEdit && (
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handlePhotoChange}
                            />
                        )}

                        {/* Text Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111' }}>{user.nome}</h2>
                            <div style={{ fontSize: '1.2rem', color: '#333', fontWeight: 'bold' }}>
                                {user.cargo || 'Cargo não informado'}
                            </div>
                            <div style={{ fontSize: '1.0rem', color: '#555', fontStyle: 'italic' }}>
                                {getSectorName(user.setor) || 'Setor não informado'}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', color: '#666', fontSize: '0.95rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📅</span> Data de Admissão: {formatDate(user.dt_adminisao)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🎓</span> Conteúdos Concluídos: {user.enrichedCertificates.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', backgroundColor: '#e0e0e0', width: '100%' }}></div>

                    {/* Badges Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#444', fontWeight: '600', fontSize: '1rem' }}>
                            <span>🏆</span> CONQUISTAS & CERTIFICAÇÕES
                        </div>

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {groupedCertificates.length > 0 ? (
                                <>
                                    {groupedCertificates.slice(0, groupedCertificates.length > 9 ? 8 : 9).map((group, index) => {
                                        const representative = group[0]; // Highest level
                                        const count = group.length;
                                        const hasRelatives = count > 1;

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => hasRelatives && setSelectedGroup(group)}
                                                title={`${representative.details?.nome || 'Certificado'} - Nível ${representative.details?.nivel || 'N/A'}\nData: ${representative.data_conclusao ? formatDate(representative.data_conclusao) : 'Não informada'}`}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    position: 'relative',
                                                    cursor: hasRelatives ? 'pointer' : 'default',
                                                }}
                                            >
                                                {/* Image Container */}
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#333',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: 'gold',
                                                    fontSize: '1.5rem',
                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                                    border: hasRelatives ? '2px solid #007bff' : '2px solid white',
                                                    overflow: 'hidden'
                                                }}>
                                                    {representative.details?.insignia ? (
                                                        <img src={representative.details.insignia} alt="Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        '★'
                                                    )}
                                                </div>

                                                {/* Stack Indicator - positioned outside the overflow hidden container */}
                                                {hasRelatives && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '-5px',
                                                        right: '-5px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 'bold',
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        border: '2px solid white',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}>
                                                        +{count - 1}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Overflow Button */}
                                    {groupedCertificates.length > 9 && (
                                        <div
                                            onClick={() => setIsViewAllOpen(true)}
                                            title="Ver todas as conquistas"
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                backgroundColor: '#eee',
                                                color: '#555',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                border: '2px solid #ddd',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            +{groupedCertificates.length - 8}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span style={{ color: '#999', fontStyle: 'italic' }}>Nenhuma conquista ainda.</span>
                            )}
                        </div>
                    </div>

                </div>

                {/* Back Button (Optional, for usability) */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'fixed',
                        bottom: '40px',
                        left: '40px',
                        padding: '10px 20px',
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '30px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        color: '#555',
                        fontWeight: 'bold'
                    }}
                >
                    ← Voltar
                </button>

                {/* Modal for Related Certificates */}
                <RelatedCertificatesModal
                    isOpen={!!selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                    certificateGroup={selectedGroup}
                />

                {/* Modal for All Certificates */}
                <RelatedCertificatesModal
                    isOpen={isViewAllOpen}
                    onClose={() => setIsViewAllOpen(false)}
                    certificateGroup={user?.enrichedCertificates ? [...user.enrichedCertificates].sort((a, b) => (b.details?.nivel || 0) - (a.details?.nivel || 0)) : []}
                    title="Todos os Certificados"
                />

                {/* Password Modal */}
                {isPasswordModalOpen && (
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
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Alterar Senha</h3>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Nova Senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Confirmar Senha</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirme a nova senha"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    onClick={() => { setIsPasswordModalOpen(false); setNewPassword(''); setConfirmPassword(''); }}
                                    style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'pointer', color: '#333' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePasswordUpdate}
                                    style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Salvar Alteração
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default UserProfilePage;
