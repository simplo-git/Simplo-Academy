import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/UserProfilePage.css';
import RelatedCertificatesModal from './static/components/RelatedCertificatesModal';

const UserProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isViewAllOpen, setIsViewAllOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch User
            const userRes = await fetch(`http://127.0.0.1:5000/api/users/${id}`);
            const userData = await userRes.json();

            // Fetch Certificates to get details (images)
            const certRes = await fetch('http://127.0.0.1:5000/api/certificates');
            const certData = await certRes.json();

            // Fetch Roles to get sector names
            const roleRes = await fetch('http://127.0.0.1:5000/api/roles');
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
                    // Check if the related cert is actually owned by the user
                    const relatedUserCert = certs.find(uc =>
                        (uc.id === rel.id || uc.certificate === rel.id) ||
                        (uc.details && uc.details._id === rel.id)
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
                }}>

                    {/* Header Section: Avatar + Info */}
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        {/* Avatar */}
                        <div style={{
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
                            border: '1px solid #eee'
                        }}>
                            {user.foto ? (
                                <img src={user.foto} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                getInitials(user.nome)
                            )}
                        </div>

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
                                    <span>📅</span> Desde: {formatDate(user.createdAt)}
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
                                                title={`${representative.details?.nome || 'Certificado'} - Nível ${representative.details?.nivel || 'N/A'}`}
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

            </main>
        </div>
    );
};

export default UserProfilePage;
