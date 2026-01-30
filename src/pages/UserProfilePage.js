import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import './static/css/UserProfilePage.css';

const UserProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [roles, setRoles] = useState([]);
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
                    const details = certData.find(c => c._id === userCert.certificate);
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
                            {user.enrichedCertificates.length > 0 ? (
                                user.enrichedCertificates.map((cert, index) => (
                                    <div key={index} title={`${cert.details?.nome || 'Certificado'} - ${cert.data_conclusao}`} style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#333', // Dark background for the badge circle as per image
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: 'gold', // Fallback icon color
                                        fontSize: '1.5rem',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                        border: '2px solid white',
                                        overflow: 'hidden'
                                    }}>
                                        {cert.details?.link ? (
                                            <img src={cert.details.link} alt="Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            '★'
                                        )}
                                    </div>
                                ))
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

            </main>
        </div>
    );
};

export default UserProfilePage;
