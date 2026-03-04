import React, { useState, useEffect } from 'react';

const QuizActivity = ({ data, context, currentAnswer, onActivityCompleted }) => {
    // Array of selected options. Index corresponds to the question index.
    const [selectedOptions, setSelectedOptions] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null); // Will now reflect if the person passed (overall) or maybe store an array of correctness

    const questoes = data.questoes || (data.pergunta ? [{ pergunta: data.pergunta, opcoes: data.opcoes || [] }] : []);

    useEffect(() => {
        if (currentAnswer) {
            setSubmitted(true);

            // Retrocompatibility: If it was a single number, map it to question 0
            if (currentAnswer.resposta !== undefined) {
                if (typeof currentAnswer.resposta === 'number' || typeof currentAnswer.resposta === 'string') {
                    setSelectedOptions({ 0: Number(currentAnswer.resposta) });
                } else if (typeof currentAnswer.resposta === 'object') {
                    // Assuming it's the new format: dictionary or array
                    setSelectedOptions(currentAnswer.resposta);
                }
            }

            const score = Number(currentAnswer.nota);
            const isPassing = !isNaN(score) && score > 0;
            setIsCorrect(isPassing);
        } else {
            setSelectedOptions({});
            setSubmitted(false);
            setIsCorrect(null);
        }
    }, [currentAnswer, context.templateId]);

    const handleSelect = (qIndex, optIndex) => {
        if (submitted || submitting) return;
        setSelectedOptions(prev => ({
            ...prev,
            [qIndex]: optIndex
        }));
    };

    const isAllAnswered = () => {
        return questoes.every((_, qIndex) => selectedOptions[qIndex] !== undefined && selectedOptions[qIndex] !== null);
    };

    const handleSubmit = async () => {
        if (!isAllAnswered() || submitting) return;

        if (!context || !context.contentId || !context.userId) {
            console.error("Missing context for quiz submission");
            return;
        }

        setSubmitting(true);

        // Calculate score locally
        let correctCount = 0;

        questoes.forEach((q, qIndex) => {
            const correctIndex = q.opcoes ? q.opcoes.findIndex(op => op.correta === true || String(op.correta) === 'true') : -1;
            if (correctIndex !== -1 && Number(selectedOptions[qIndex]) === Number(correctIndex)) {
                correctCount++;
            }
        });

        const grade = questoes.length > 0 ? (correctCount / questoes.length) * 100 : 0;
        const correctness = grade > 0; // We define correctness as having at least some correct
        setIsCorrect(correctness);

        const payload = {
            user_id: context.userId,
            template_id: context.templateId,
            tipo: 'multipla_escolha',
            resposta: selectedOptions, // Sending the mapping of responses
            realizado: true,
            data_conclusao: new Date().toISOString(),
            nota: grade
        };

        try {
            const response = await fetch(`http://192.168.0.17:9000/api/conteudos/${context.contentId}/resposta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const responseData = await response.json();

                // If backend returns a calculated score, use it (optional)

                setSubmitted(true);
                if (onActivityCompleted) {
                    onActivityCompleted();
                }
            } else {
                alert("Erro ao enviar resposta. Tente novamente.");
            }
        } catch (err) {
            console.error("Erro no envio:", err);
            alert("Erro de conexão.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="activity-quiz" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'left' }}>

            {questoes.map((questao, qIndex) => (
                <div key={qIndex} style={{
                    marginBottom: '30px',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    border: '1px solid #f0f0f0'
                }}>
                    <h3 style={{ marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        <span style={{ color: '#007bff', marginRight: '10px' }}>{qIndex + 1}.</span>
                        {questao.pergunta ? (
                            <span dangerouslySetInnerHTML={{ __html: questao.pergunta }} />
                        ) : (
                            <span>Selecione a resposta correta:</span>
                        )}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {questao.opcoes && questao.opcoes.map((op, idx) => {
                            let borderColor = '#ddd';
                            let bgColor = 'white';

                            const opText = typeof op === 'object' ? op.texto : op;
                            const isSelected = selectedOptions[qIndex] === idx;

                            if (submitted) {
                                const correctIdx = questao.opcoes.findIndex(o => o.correta === true || String(o.correta) === 'true');
                                const isOptionCorrect = correctIdx === idx;

                                if (isSelected) {
                                    if (isOptionCorrect) {
                                        borderColor = '#28a745';
                                        bgColor = '#d4edda';
                                    } else {
                                        borderColor = '#dc3545';
                                        bgColor = '#f8d7da';
                                    }
                                } else if (isOptionCorrect) {
                                    borderColor = '#28a745';
                                }
                            } else if (isSelected) {
                                borderColor = '#007bff';
                                bgColor = '#f0f8ff';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(qIndex, idx)}
                                    disabled={submitted || submitting}
                                    style={{
                                        padding: '15px',
                                        textAlign: 'left',
                                        borderRadius: '8px',
                                        border: `2px solid ${borderColor}`,
                                        backgroundColor: bgColor,
                                        cursor: submitted ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: `2px solid ${isSelected ? (submitted ? borderColor : '#007bff') : '#ccc'}`,
                                        marginRight: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? (submitted ? borderColor : '#007bff') : 'transparent'
                                    }}>
                                        {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></span>}
                                    </div>
                                    <span style={{ flex: 1 }}>{opText}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {!submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={!isAllAnswered() || submitting}
                    style={{
                        marginTop: '10px',
                        padding: '15px 20px',
                        backgroundColor: (!isAllAnswered() || submitting) ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: (!isAllAnswered() || submitting) ? 'not-allowed' : 'pointer',
                        width: '100%',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        transition: 'backgroundColor 0.3s'
                    }}
                >
                    {submitting ? 'Enviando...' : (isAllAnswered() ? 'Confirmar Respostas' : 'Responda todas as questões para confirmar')}
                </button>
            )}

            {submitted && isCorrect !== null && (
                <div style={{
                    marginTop: '20px', padding: '20px', borderRadius: '8px',
                    backgroundColor: isCorrect ? '#d4edda' : '#f8d7da',
                    color: isCorrect ? '#155724' : '#721c24',
                    textAlign: 'center',
                    border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    <strong style={{ fontSize: '1.2rem' }}>
                        {isCorrect ? 'Bom trabalho!' : 'Você pode melhorar!'}
                    </strong>
                    <div style={{ marginTop: '10px', fontSize: '1rem' }}>
                        Pontuação Obtida: <strong>{(currentAnswer?.nota) ? Number(currentAnswer.nota).toFixed(1) : (isCorrect ? '100' : '0')}</strong> de 100
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizActivity;
