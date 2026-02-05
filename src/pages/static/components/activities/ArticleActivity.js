import React, { useState, useEffect, useRef } from 'react';

const ArticleActivity = ({ data, onAnswer, activityId, currentAnswer }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const contentRef = useRef(null);

    // Initial Setup: Parse time and check existing progress
    useEffect(() => {
        if (currentAnswer) {
            setIsCompleted(true);
            return;
        }

        // Parse reading time (expected format: "X mins" or just number)
        let seconds = 0;
        if (data.tempoLeitura) {
            const minutes = parseInt(data.tempoLeitura);
            if (!isNaN(minutes)) {
                seconds = minutes * 60;
            }
        }

        if (seconds > 0) {
            setTimeLeft(seconds);
        }

    }, [data.tempoLeitura, currentAnswer]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft === null || isCompleted) return;

        if (timeLeft <= 0) {
            handleCompletion('Tempo de leitura finalizado');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isCompleted]);

    // Scroll Logic
    const handleScroll = (e) => {
        if (isCompleted) return;

        const element = e.target;
        // Check if scrolled to bottom (with small buffer)
        if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
            handleCompletion('Leitura concluída (Scroll)');
        }
    };

    const handleCompletion = (reason) => {
        if (isCompleted) return;
        setIsCompleted(true);
        console.log(`Artigo concluído: ${reason}`);

        // Auto-submit completion
        // For article, we don't have a "grade", it's just done.
        onAnswer({
            template_id: activityId,
            tipo: 'artigo',
            resposta: 'Leitura Concluída',
            correta: true, // Auto-correct/complete
            nota: 100 // Full score for reading
        });
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="activity-container article-activity">
            <div className="activity-header">
                <h3>{data.titulo}</h3>
                {timeLeft !== null && !isCompleted && (
                    <div className="timer-badge">
                        ⏱️ Tempo restante: {formatTime(timeLeft)}
                    </div>
                )}
                {isCompleted && (
                    <div className="completion-badge success">
                        ✅ Leitura Concluída
                    </div>
                )}
            </div>

            <div
                className="article-content-scroll"
                ref={contentRef}
                onScroll={handleScroll}
                style={{
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    padding: '20px',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    lineHeight: '1.6',
                    fontSize: '1rem'
                }}
            >
                {/* Render HTML content safely if possible, or just text */}
                {/* Assuming content might be HTML from rich text editor */}
                <div dangerouslySetInnerHTML={{ __html: data.conteudo }} />
            </div>

            <div className="activity-footer">
                <small style={{ color: '#666' }}>
                    ℹ️ Role até o fim ou aguarde o tempo para concluir.
                </small>
            </div>
        </div>
    );
};

export default ArticleActivity;
