import React from 'react';

const RelatedCertificatesModal = ({ isOpen, onClose, certificateGroup, title }) => {
    if (!isOpen || !certificateGroup || certificateGroup.length === 0) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Data desconhecida';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                width: '90%',
                maxWidth: '500px',
                padding: '30px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                position: 'relative',
                animation: 'fadeIn 0.3s ease-in-out'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    &times;
                </button>

                <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#333' }}>
                    {title || 'Certificações Relacionadas'}
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    paddingRight: '5px' // Prevent scrollbar from overlapping content slightly
                }}>
                    {certificateGroup.map((cert, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            padding: '10px',
                            border: '1px solid #eee',
                            borderRadius: '10px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            {/* Badge Icon */}
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: '#333',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '2px solid white',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                {cert.details?.insignia ? (
                                    <img src={cert.details.insignia} alt="Badge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ color: 'gold', fontSize: '1.5rem' }}>★</span>
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                                    {cert.details?.nome || 'Certificado'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                    Nível: {cert.details?.nivel || 'N/A'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                    Concluído em: {formatDate(cert.data_emissao || cert.data_conclusao)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RelatedCertificatesModal;
