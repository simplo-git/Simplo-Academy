import React, { useState, useEffect } from 'react';

const TextActivity = ({ data, onAnswer, currentAnswer, activityId }) => {
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Handle nested data if present
    const activityData = data.dados || data;
    const { enunciado, orientacoes, texto, content, titulo } = activityData;

    // Fallback for the main text content
    const questionText = enunciado || texto || content || '';

    // Effect to handle existing answer (locking)
    useEffect(() => {
        if (currentAnswer && currentAnswer.resposta) {
            setAnswer(currentAnswer.resposta);
            setSubmitted(true);
        }
    }, [currentAnswer]);

    const handleSubmit = async () => {
        if (!answer.trim()) {
            alert('Por favor, escreva uma resposta.');
            return;
        }

        setSubmitting(true);

        try {
            await onAnswer({
                template_id: activityId,
                tipo: 'texto_livre',
                resposta: answer,
                realizado: false, // Requires manual correction usually
                nota: null
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Erro no envio:", err);
            alert('Erro ao enviar resposta.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="activity-text" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            {data.titulo && <h3 style={{ marginBottom: '20px' }}>{data.titulo}</h3>}

            {/* Question / Enunciation */}
            <div style={{ marginBottom: '25px', fontSize: '1.1rem', lineHeight: '1.6', color: '#333' }}>
                <div dangerouslySetInnerHTML={{ __html: questionText }} />
            </div>

            {/* Guidance / Instructions */}
            {orientacoes && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px', fontSize: '0.9rem', color: '#555' }}>
                    <strong>Orientações:</strong>
                    <p style={{ margin: '5px 0 0 0' }}>{orientacoes}</p>
                </div>
            )}

            {/* Answer Input */}
            {!submitted ? (
                <div style={{ marginTop: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Sua Resposta:</label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Digite sua resposta aqui..."
                        disabled={submitting}
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #ccc',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            backgroundColor: submitting ? '#f5f5f5' : 'white'
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            marginTop: '15px',
                            padding: '10px 20px',
                            backgroundColor: submitting ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {submitting ? 'Enviando...' : 'Enviar Resposta'}
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', color: '#155724', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>✅ Atividade Respondida</h4>
                        <p style={{ margin: 0 }}>Sua resposta foi enviada.</p>
                    </div>

                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>Sua Resposta:</label>
                    <div style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        backgroundColor: '#f9f9f9',
                        fontSize: '1rem',
                        color: '#333',
                        whiteSpace: 'pre-wrap', // Preserves line breaks
                        wordBreak: 'break-word' // Breaks long words
                    }}>
                        {answer}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextActivity;
