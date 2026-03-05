import React, { useState, useEffect } from 'react';
import ActivityRenderer from './ActivityRenderer';
import '../css/ContentWizard.css'; // Reuse container styles
import { getUser } from '../../../auth/auth';
import ConfirmationModal from './ConfirmationModal';

const ContentPlayerModal = ({ content, onClose }) => {
    const user = getUser();
    const userId = user ? (user._id || user.id) : null;
    const [templates, setTemplates] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [contentData, setContentData] = useState(content); // Local state for content data
    const [userAnswers, setUserAnswers] = useState([]);

    // States for completion screen
    const [showCompletion, setShowCompletion] = useState(false);
    const [completionData, setCompletionData] = useState(null);
    const [certificateDetails, setCertificateDetails] = useState(null);
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    // Fetch fresh content data to get user progress
    const refreshContent = async () => {
        try {
            const res = await fetch(`http://192.168.0.17:9000/api/conteudos/${content._id}`);
            if (res.ok) {
                const data = await res.json();
                setContentData(data);

                // Extract answers for current user
                let foundAnswers = [];
                if (userId && data.usuarios) {
                    // Try direct lookup first
                    if (data.usuarios[userId]) {
                        // Check 'conteudo' first as per user report, fallback to 'respostas'
                        foundAnswers = data.usuarios[userId].conteudo || data.usuarios[userId].respostas || [];
                    } else {
                        // Fallback: iterate keys to check for type mismatch (string vs number vs object)
                        const userKey = Object.keys(data.usuarios).find(key => String(key) === String(userId));
                        if (userKey) {
                            foundAnswers = data.usuarios[userKey].conteudo || data.usuarios[userKey].respostas || [];
                        }
                    }
                }
                setUserAnswers(foundAnswers);
            }
        } catch (err) {
            console.error("Erro ao atualizar progress do conteúdo:", err);
        }
    };

    useEffect(() => {
        // Initial fetch to ensure we have latest progress
        refreshContent();

        const loadContentActivities = async () => {
            try {
                // Determine template IDs. 
                const templateIds = (content.conteudos || []).map(c =>
                    typeof c === 'object' ? c._id : c
                );

                if (templateIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch details for each template with error handling
                const promises = templateIds.map(async id => {
                    try {
                        const res = await fetch(`http://192.168.0.17:9000/api/activity-templates/${id}`);
                        if (!res.ok) {
                            console.warn(`Template fetch failed for ${id}: ${res.status}`);
                            return null;
                        }
                        return await res.json();
                    } catch (err) {
                        console.error(`Error fetching template ${id}:`, err);
                        return null;
                    }
                });

                const results = await Promise.all(promises);
                const fetchedTemplates = results.filter(t => t !== null);

                setTemplates(fetchedTemplates);

                // Flatten activities
                const flattened = fetchedTemplates.flatMap(t => {
                    // Check if 'atividades' exists and is array (legacy/composite template)
                    if (Array.isArray(t.atividades) && t.atividades.length > 0) {
                        return t.atividades.map(act => ({
                            ...act,
                            templateName: t.nome,
                            thumbnail: t.data?.thumbnail
                        }));
                    }

                    // Otherwise, the template IS the activity
                    // Detect if the actual data is nested in 'dados' (common in new structure)
                    // Or directly in 'template', or root 'data'
                    let actData = t.template || t.data || {};

                    // Unwrap 'dados' if present and has the content we need (like url or question)
                    if (actData.dados) {
                        actData = actData.dados;
                    }

                    return [{
                        _id: t._id,
                        tipo: t.tipo,
                        data: actData,
                        templateName: t.nome,
                        thumbnail: t.template?.thumbnail || t.data?.thumbnail || actData.thumbnail
                    }];
                });

                setAllActivities(flattened);
            } catch (err) {
                console.error("Erro geral ao carregar atividades", err);
            } finally {
                setLoading(false);
            }
        };
        loadContentActivities();
    }, [content]);

    // Callback when an activity is submitted
    const handleAnswer = async (answerData) => {
        if (!userId) return;

        try {
            const payload = {
                user_id: userId,
                template_id: answerData.template_id || contentData.conteudos[currentActivityIndex]._id, // Fallback
                ...answerData
            };

            const response = await fetch(`http://192.168.0.17:9000/api/conteudos/${content._id}/resposta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await refreshContent(); // Refresh to show updated status
            } else {
                console.error("Erro ao salvar resposta:", await response.text());
                alert("Erro ao salvar progresso.");
            }
        } catch (err) {
            console.error("Erro de conexão ao responder:", err);
            alert("Erro de conexão.");
        }
    };

    const handleActivityCompleted = () => {
        refreshContent();
    };

    const handleNext = async () => {
        if (currentActivityIndex < allActivities.length - 1) {
            setCurrentActivityIndex(prev => prev + 1);
        } else {
            // Finished - call backend to conclude
            if (userId) {
                try {
                    const response = await fetch(`http://192.168.0.17:9000/api/conteudos/${content._id}/conclusao`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ user_id: userId })
                    });


                    if (response.ok) {
                        const data = await response.json();
                        setCompletionData(data);

                        // Fetch certificate if applicable
                        if (contentData && contentData.certificado_id) {
                            try {
                                const certRes = await fetch(`http://192.168.0.17:9000/api/certificates`);
                                if (certRes.ok) {
                                    const allCerts = await certRes.json();
                                    const cert = allCerts.find(c => String(c._id) === String(contentData.certificado_id));
                                    if (cert) setCertificateDetails(cert);
                                }
                            } catch (e) { console.error("Erro ao buscar certificado:", e); }
                        }

                        setShowCompletion(true);
                        return; // Prevent modal from closing immediately
                    } else {
                        console.error("Erro ao concluir conteúdo:", await response.text());
                        alert("Conteúdo finalizado, mas houve um erro ao salvar a conclusão.");
                        exitFullscreenAndClose();
                    }
                } catch (error) {
                    console.error("Erro de conexão ao concluir:", error);
                    exitFullscreenAndClose();
                }
            } else {
                exitFullscreenAndClose();
            }
        }
    };

    const handlePrevious = () => {
        if (currentActivityIndex > 0) {
            setCurrentActivityIndex(prev => prev - 1);
        }
    };

    const currentActivity = allActivities[currentActivityIndex];
    const progressPercent = allActivities.length > 0
        ? ((currentActivityIndex + 1) / allActivities.length) * 100
        : 0;

    // Find answer for current activity
    const currentAnswer = currentActivity ? userAnswers.find(a => String(a.template_id) === String(currentActivity._id)) : null;

    // Check for mandatory completion
    const isMandatory = currentActivity?.data?.obrigatorio;
    const isCompleted = !!currentAnswer; // Simple check for existence of answer/completion
    const isBlocked = isMandatory && !isCompleted;

    // Check overall content completion
    let isContentFinished = false;
    if (userId && contentData.usuarios) {
        if (contentData.usuarios[userId]) {
            isContentFinished = contentData.usuarios[userId].realizado;
        } else {
            const userKey = Object.keys(contentData.usuarios).find(key => String(key) === String(userId));
            if (userKey) {
                isContentFinished = contentData.usuarios[userKey].realizado;
            }
        }
    }

    const isLastActivity = currentActivityIndex === allActivities.length - 1;

    // Button label logic
    let nextLabel = 'Próximo';
    if (isLastActivity) {
        nextLabel = isContentFinished ? 'Fechar (Concluído)' : 'Concluir';
    }

    // Enter Fullscreen on Mount
    useEffect(() => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log("Fullscreen request denied/failed:", err));
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }

        // Cleanup: Exit fullscreen on unmount (optional, but good practice if modal unmounts)
        return () => {
            if (document.exitFullscreen) {
                // Check if we are in fullscreen before exiting (to avoid error if user already exited)
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.log("Exit fullscreen error", e));
                }
            }
        };
    }, []);

    const handleClose = (e) => {
        e?.preventDefault();

        // Debugging state
        console.log("Tentando fechar...", { isContentFinished, progressPercent });

        // If finished, just exit
        if (isContentFinished) {
            exitFullscreenAndClose();
            return;
        }

        // Calculate remaining percentage
        const remaining = Math.max(0, 100 - progressPercent);

        // Force confirm using custom modal instead of window.confirm
        setShowConfirmClose(true);
    };

    const handleConfirmClose = () => {
        exitFullscreenAndClose();
    };

    const exitFullscreenAndClose = () => {
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log("Exit fullscreen error", e));
        }
        onClose();
    };

    return (
        <div className="wizard-overlay">
            {/* Custom Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmClose}
                onClose={() => setShowConfirmClose(false)}
                onConfirm={handleConfirmClose}
                title="Sair do Conteúdo"
                message={`Você concluiu ${Math.round(progressPercent)}% do conteúdo. Ainda falta ${Math.round(Math.max(0, 100 - progressPercent))}%. Tem certeza que deseja sair? O progresso será salvo.`}
                confirmText="Sair mesmo assim"
                cancelText="Continuar assistindo"
            />

            <div className="wizard-container" style={{ maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="wizard-header" style={{ flexShrink: 0 }}>
                    <div>
                        <h2 className="wizard-title">{content.nome}</h2>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {loading ? 'Carregando...' : (
                                currentActivity ? `${currentActivity.templateName} - Atividade ${currentActivityIndex + 1} de ${allActivities.length}` : 'Vazio'
                            )}
                            {isMandatory && <span style={{ marginLeft: '10px', color: '#d9534f', fontWeight: 'bold', fontSize: '0.8rem' }}>* Obrigatório</span>}
                            {isContentFinished && <span style={{ marginLeft: '10px', color: '#28a745', fontWeight: 'bold', fontSize: '0.8rem' }}>✓ Conteúdo Finalizado</span>}
                        </div>
                    </div>
                    <button className="wizard-close" onClick={handleClose} title="Fechar">×</button>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '4px', backgroundColor: '#eee', width: '100%' }}>
                    <div style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        backgroundColor: '#28a745',
                        transition: 'width 0.3s'
                    }}></div>
                </div>

                {/* Content Body */}
                <div className="wizard-body" style={{ flex: 1, overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#ffffffff' }}>
                    {showCompletion ? (
                        <div style={{
                            width: '90%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                            textAlign: 'center',
                            animation: 'fadeIn 0.5s ease-in-out'
                        }}>
                            {completionData?.final_status === 'aprovado' ? (
                                <>
                                    <div style={{ fontSize: '5rem', marginBottom: '20px', animation: 'bounce 2s infinite' }}>🎉</div>
                                    <h2 style={{ color: '#28a745', marginBottom: '10px', fontSize: '2rem' }}>Parabéns!</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>Você concluiu este conteúdo com sucesso e foi aprovado com nota <strong>{completionData.nota}</strong>.</p>

                                    {certificateDetails && (
                                        <div style={{
                                            marginTop: '20px',
                                            padding: '20px',
                                            borderRadius: '15px',
                                            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                                            border: '2px solid #ffd700',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            maxWidth: '400px'
                                        }}>
                                            <h3 style={{ margin: '0 0 15px', color: '#333' }}>Certificado Desbloqueado</h3>
                                            {certificateDetails.insignia ? (
                                                <img src={certificateDetails.insignia} alt="Certificado" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '4px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', marginBottom: '15px' }} />
                                            ) : (
                                                <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🏆</div>
                                            )}
                                            <p style={{ fontWeight: 'bold', margin: '0', color: '#111', fontSize: '1.1rem' }}>{certificateDetails.nome}</p>
                                        </div>
                                    )}
                                </>
                            ) : completionData?.final_status === 'reprovado' ? (
                                <>
                                    <div style={{ fontSize: '5rem', marginBottom: '20px' }}>😔</div>
                                    <h2 style={{ color: '#dc3545', marginBottom: '10px', fontSize: '2rem' }}>Não foi dessa vez!</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>Você concluiu o conteúdo, mas não alcançou a nota necessária. Sua nota foi <strong>{completionData.nota}</strong>.</p>
                                </>
                            ) : completionData?.final_status === 'aguardando correção' ? (
                                <>
                                    <div style={{ fontSize: '5rem', marginBottom: '20px' }}>⏳</div>
                                    <h2 style={{ color: '#17a2b8', marginBottom: '10px', fontSize: '2rem' }}>Conteúdo Concluído!</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>Suas atividades foram enviadas com sucesso e agora estão <strong>aguardando correção manual</strong> do instrutor.</p>
                                    {certificateDetails && (
                                        <div style={{ marginTop: '20px', opacity: 0.7 }}>
                                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>Certificado em potencial:</p>
                                            {certificateDetails.insignia ? (
                                                <img src={certificateDetails.insignia} alt="Certificado Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', filter: 'grayscale(100%)' }} />
                                            ) : (
                                                <div style={{ fontSize: '3rem' }}>🏆</div>
                                            )}
                                            <p style={{ fontSize: '0.85rem', margin: '5px 0 0', fontWeight: 'bold' }}>{certificateDetails.nome}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Fallback */}
                                    <div style={{ fontSize: '5rem', marginBottom: '20px' }}>✅</div>
                                    <h2 style={{ color: '#28a745', marginBottom: '10px', fontSize: '2rem' }}>Concluído!</h2>
                                    <p style={{ fontSize: '1.2rem', color: '#555' }}>O conteúdo foi finalizado com sucesso.</p>
                                </>
                            )}

                            <style>
                                {`
                                    @keyframes fadeIn {
                                        from { opacity: 0; transform: translateY(20px); }
                                        to { opacity: 1; transform: translateY(0); }
                                    }
                                    @keyframes bounce {
                                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                                        40% { transform: translateY(-20px); }
                                        60% { transform: translateY(-10px); }
                                    }
                                `}
                            </style>
                        </div>
                    ) : loading ? (
                        <div style={{ alignSelf: 'center' }}>Carregando conteúdo...</div>
                    ) : allActivities.length === 0 ? (
                        <div style={{ alignSelf: 'center' }}>Nenhuma atividade neste conteúdo.</div>
                    ) : (
                        <div style={{ width: '100%', maxWidth: '900px', padding: '40px', backgroundColor: 'white', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <ActivityRenderer
                                activity={currentActivity}
                                contentId={content._id}
                                userId={userId}
                                currentAnswer={currentAnswer}
                                onActivityCompleted={handleActivityCompleted}
                                onAnswer={handleAnswer}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="wizard-footer" style={{ borderTop: '1px solid #ddd', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    {showCompletion ? (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button
                                className="btn-primary"
                                onClick={exitFullscreenAndClose}
                                style={{ padding: '12px 30px', fontSize: '1.2rem', borderRadius: '30px' }}
                            >
                                Sair
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                className="btn-secondary"
                                onClick={handlePrevious}
                                disabled={currentActivityIndex === 0}
                            >
                                Anterior
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isBlocked && (
                                    <span style={{ color: '#d9534f', fontSize: '0.9rem' }}>
                                        Complete a atividade para continuar
                                    </span>
                                )}
                                <button
                                    className="btn-primary"
                                    onClick={async () => {
                                        // If last activity AND already finished, just close
                                        if (isLastActivity && isContentFinished) {
                                            exitFullscreenAndClose();
                                            return;
                                        }
                                        await handleNext();
                                    }}
                                    disabled={isBlocked}
                                    style={{
                                        opacity: isBlocked ? 0.5 : 1,
                                        cursor: isBlocked ? 'not-allowed' : 'pointer',
                                        backgroundColor: (isLastActivity && isContentFinished) ? '#6c757d' : undefined, // Grey if just closing
                                        borderColor: (isLastActivity && isContentFinished) ? '#6c757d' : undefined
                                    }}
                                >
                                    {nextLabel}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentPlayerModal;
