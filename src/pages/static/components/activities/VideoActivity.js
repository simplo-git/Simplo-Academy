import React, { useState, useEffect } from 'react';

const VideoActivity = ({ data, context, currentAnswer, onActivityCompleted }) => {
    const [completed, setCompleted] = useState(false);

    // Check if already completed previously
    useEffect(() => {
        if (currentAnswer) {
            setCompleted(true);
        }
    }, [currentAnswer]);

    const videoUrl = data.url || (data.dados && data.dados.url);

    const handleVideoEnded = async () => {
        if (completed) return; // Already marked

        if (!context || !context.contentId || !context.userId) {
            console.error("Missing context for video completion", context);
            return;
        }

        try {
            const payload = {
                user_id: context.userId,
                template_id: context.templateId,
                tipo: 'video', // Force type video
                resposta: 'Vídeo assistido completo',
                realizado: true, // Auto-complete for videos
                data_conclusao: new Date().toISOString(),
                nota: 100 // Optional: full score for watching
            };

            const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${context.contentId}/resposta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setCompleted(true);
                if (onActivityCompleted) {
                    onActivityCompleted();
                }
            } else {
                console.error("Erro ao salvar progresso do vídeo");
            }
        } catch (err) {
            console.error("Erro de conexão ao salvar vídeo:", err);
        }
    };

    return (
        <div className="activity-video" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>{data.titulo || 'Assista ao Vídeo'}</h3>

            {completed && (
                <div style={{
                    marginBottom: '15px',
                    padding: '10px 20px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                }}>
                    ✅ Vídeo Concluído
                </div>
            )}

            {videoUrl ? (
                <div style={{ width: '100%', maxWidth: '800px', aspectRatio: '16/9', backgroundColor: '#000' }}>
                    <video
                        src={videoUrl}
                        controls
                        style={{ width: '100%', height: '100%' }}
                        onEnded={handleVideoEnded}
                    >
                        Seu navegador não suporta a visualização deste vídeo.
                    </video>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                    <p>Vídeo não disponível ou URL inválida.</p>
                    <small>{JSON.stringify(data)}</small>
                </div>
            )}

            {data.obrigatorio && !completed && (
                <p style={{ marginTop: '10px', color: '#d9534f', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    * Assista até o final para continuar.
                </p>
            )}

            {data.descricao && <p style={{ marginTop: '15px', color: '#555' }}>{data.descricao}</p>}
        </div>
    );
};

export default VideoActivity;
