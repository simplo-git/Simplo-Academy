import React, { useState, useEffect } from 'react';
import { getUser } from '../../../auth/auth';

const ContentCard = ({ content, onClick }) => {
    const [firstTemplate, setFirstTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get current user to check progress
    const user = getUser();
    const userId = user ? (user._id || user.id) : null;

    useEffect(() => {
        const fetchFirstTemplate = async () => {
            if (content.conteudos && content.conteudos.length > 0) {
                const firstItem = content.conteudos[0];
                // If it's already an object, use it
                if (typeof firstItem === 'object' && firstItem.tipo) {
                    setFirstTemplate(firstItem);
                    setLoading(false);
                    return;
                }

                // If it's an ID (string), fetch it
                const tmplId = typeof firstItem === 'string' ? firstItem : firstItem._id || firstItem.id;

                try {
                    const response = await fetch(`http://127.0.0.1:5000/api/activity-templates/${tmplId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setFirstTemplate(data);
                    }
                } catch (err) {
                    console.error("Erro ao buscar template de capa", err);
                }
            }
            setLoading(false);
        };

        fetchFirstTemplate();
    }, [content]);

    const isVideo = firstTemplate && firstTemplate.tipo === 'video';

    // Helper to get data object
    let templateData = firstTemplate ? (firstTemplate.template || firstTemplate.data || {}) : {};
    // Unwrap 'dados' if present (common in video-upload structure)
    if (templateData.dados) {
        templateData = templateData.dados;
    }

    console.log("ContentCard Debug:", {
        name: content.nome,
        isVideo,
        templateData,
        thumbnail: templateData.thumbnail
    });

    // Check completion status
    // Use robust logic similar to modal: data.usuarios keys might differ in type
    let isCompleted = false;
    if (userId && content.usuarios) {
        if (content.usuarios[userId]) {
            isCompleted = content.usuarios[userId].realizado;
        } else {
            // Fallback lookup
            const userKey = Object.keys(content.usuarios).find(key => String(key) === String(userId));
            if (userKey) {
                isCompleted = content.usuarios[userKey].realizado;
            }
        }
    }

    return (
        <div
            className="course-card"
            onClick={() => onClick(content)}
            style={{
                border: isCompleted ? '2px solid #28a745' : '1px solid #f0f0f0', // Green border if done
            }}
        >
            {/* Completion Badge - Always absolute */}
            {isCompleted && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    ✓ Concluído
                </div>
            )}

            {/* Visual Header - 140px fixed height */}
            <div style={{
                height: '140px',
                backgroundColor: '#f5f5f5',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                {/* Case 1: Video or Custom Thumbnail */}
                {(templateData.thumbnail || (isVideo && (templateData.url || templateData.arquivo))) ? (
                    <>
                        {templateData.thumbnail ? (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${templateData.thumbnail})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}></div>
                        ) : (
                            <video
                                src={templateData.url || templateData.arquivo}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                muted
                                preload="metadata"
                            />
                        )}
                        {/* Play Button Overlay if Video */}
                        {isVideo && (
                            <div style={{
                                position: 'absolute',
                                zIndex: 2,
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }}>
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="#333" style={{ marginLeft: '4px' }}>
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        )}
                    </>
                ) : (
                    /* Case 2: No Media - Show Type Icon & Colored Background */
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Default gradient
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3.5rem'
                    }}>
                        {/* Icon decision based on type */}
                        {(() => {
                            const type = firstTemplate?.tipo;
                            if (type === 'quiz') return '🧩';
                            if (type === 'upload') return '📤';
                            if (type === 'artigo' || type === 'texto_livre') return '📖';
                            return '🎓'; // Default
                        })()}
                    </div>
                )}
            </div>

            {/* Content Body - Unified */}
            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                {/* Title and Level */}
                <div style={{ marginBottom: '10px' }}>
                    <h3 style={{
                        margin: '0 0 5px 0',
                        fontSize: '1rem',
                        color: '#333',
                        paddingRight: isCompleted ? '20px' : '0',
                        lineHeight: '1.4',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                    }}>
                        {content.nome}
                    </h3>
                    <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: content.nivel >= 2 ? '#fff3cd' : '#d1ecf1',
                        color: content.nivel >= 2 ? '#856404' : '#0c5460'
                    }}>
                        Nível {content.nivel || 1}
                    </span>
                </div>

                {/* Description */}
                <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3, // Allow 3 lines
                    WebkitBoxOrient: 'vertical',
                    marginBottom: '10px',
                    lineHeight: '1.4'
                }}>
                    {content.descricao || (firstTemplate ? (firstTemplate.descricao || templateData.descricao) : 'Sem descrição')}
                </p>

                {/* Footer / Meta */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#888' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ opacity: 0.7 }}>
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                        {content.conteudos ? content.conteudos.length : 0} atividades
                    </span>
                    {firstTemplate && (
                        <span style={{ marginLeft: '10px', opacity: 0.7 }}>
                            • {firstTemplate.tipo === 'texto_livre' ? 'Texto' :
                                firstTemplate.tipo === 'upload' ? 'Upload' :
                                    firstTemplate.tipo === 'artigo' ? 'Leitura' :
                                        firstTemplate.tipo === 'video' ? 'Vídeo' :
                                            firstTemplate.tipo === 'quiz' ? 'Quiz' : 'Geral'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentCard;
