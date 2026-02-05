import React, { useState, useEffect } from 'react';
import ActivityRenderer from './ActivityRenderer';
import '../css/ContentWizard.css'; // Reuse container styles
import { getUser } from '../../../auth/auth';

const ContentPlayerModal = ({ content, onClose }) => {
    const user = getUser();
    const userId = user ? (user._id || user.id) : null;
    const [templates, setTemplates] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [contentData, setContentData] = useState(content); // Local state for content data
    const [userAnswers, setUserAnswers] = useState([]);

    // Fetch fresh content data to get user progress
    const refreshContent = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/conteudos/${content._id}`);
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
                        const res = await fetch(`http://127.0.0.1:5000/api/activity-templates/${id}`);
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

            const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${content._id}/resposta`, {
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
                    const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${content._id}/conclusao`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ user_id: userId })
                    });


                    if (response.ok) {
                        alert("Parabéns! Conteúdo Concluído com Sucesso!");
                    } else {
                        console.error("Erro ao concluir conteúdo:", await response.text());
                        alert("Conteúdo finalizado, mas houve um erro ao salvar a conclusão.");
                    }
                } catch (error) {
                    console.error("Erro de conexão ao concluir:", error);
                }
            }
            // Exit fullscreen and close
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.log(e));
            }
            onClose();
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

        // Force confirm
        if (window.confirm(`Você concluiu ${Math.round(progressPercent)}% do conteúdo. Ainda falta ${Math.round(remaining)}%. Tem certeza que deseja sair?`)) {
            exitFullscreenAndClose();
        }
    };

    const exitFullscreenAndClose = () => {
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log("Exit fullscreen error", e));
        }
        onClose();
    };

    return (
        <div className="wizard-overlay">
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
                    {loading ? (
                        <div style={{ alignSelf: 'center' }}>Carregando conteúdo...</div>
                    ) : allActivities.length === 0 ? (
                        <div style={{ alignSelf: 'center' }}>Nenhuma atividade neste conteúdo.</div>
                    ) : (
                        <div style={{ width: '100%', maxWidth: '900px', padding: '40px', backgroundColor: 'white', minHeight: '100%' }}>
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
                </div>
            </div>
        </div>
    );
};

export default ContentPlayerModal;
