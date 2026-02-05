import React, { useState, useEffect } from 'react';

const QuizActivity = ({ data, context, currentAnswer, onActivityCompleted }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);

    // Initial load check and State Reset on change
    useEffect(() => {
        console.log("Quiz useEffect Update:", { currentAnswer, templateId: context.templateId });

        if (currentAnswer) {
            setSubmitted(true);
            if (currentAnswer.resposta !== undefined) {
                setSelectedOption(currentAnswer.resposta);
            }

            // Should be robust: check if nota exists and is > 0
            // Also handle if nota is string '100'
            const score = Number(currentAnswer.nota);
            const isPassing = !isNaN(score) && score > 0;
            console.log("Quiz Correction Check:", {
                rawNota: currentAnswer.nota,
                parsedScore: score,
                isPassing
            });

            setIsCorrect(isPassing);
        } else {
            // New activity or not answered yet - RESET state
            setSelectedOption(null);
            setSubmitted(false);
            setIsCorrect(null);
        }
    }, [currentAnswer, context.templateId]);

    const handleSelect = async (index) => {
        if (submitted) return; // Prevent change if already submitted

        setSelectedOption(index);

        // Auto-submit functionality could be here, but let's use a explicit "Confirmar" button 
        // OR submit immediately on click if desired. Let's do explicit button for better UX.
    };

    const handleSubmit = async () => {
        if (selectedOption === null || submitting) return;

        if (!context || !context.contentId || !context.userId) {
            console.error("Missing context for quiz submission");
            return;
        }

        setSubmitting(true);

        // Check correctness locally
        // The template saves 'correta' boolean inside the option object in 'opcoes' array
        // Find the index of the correct option
        const correctIndex = data.opcoes ? data.opcoes.findIndex(op => op.correta === true || String(op.correta) === 'true') : -1;

        console.log("Quiz Debug:", {
            selectedOption,
            selectedType: typeof selectedOption,
            correctIndex,
            correctType: typeof correctIndex,
            comparison: Number(correctIndex) === Number(selectedOption),
            options: data.opcoes
        });

        let grade = null;
        let done = false;
        let correctness = null;

        if (correctIndex !== -1) {
            correctness = (Number(correctIndex) === Number(selectedOption));
            grade = correctness ? 100 : 0;
            done = true;
            setIsCorrect(correctness);
        } else {
            // If no correct answer defined, treat as survey? Or always correct?
            // Let's assume manual or just done. 
            // If user requested stricter logic rework, we assume there IS a correct answer.
            console.warn("Nenhuma resposta correta definida no template");
            done = true;
        }

        const payload = {
            user_id: context.userId,
            template_id: context.templateId,
            tipo: 'multipla_escolha',
            resposta: selectedOption, // Sending the index
            realizado: true, // Mark as done for navigation purposes (even if wrong, the activity is "done")
            data_conclusao: new Date().toISOString(),
            nota: grade
        };

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${context.contentId}/resposta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const responseData = await response.json();

                // If backend returns explicit correctness, trust it over local calc
                if (responseData.correta !== undefined) {
                    setIsCorrect(responseData.correta === true || responseData.correta === 'true');
                }

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
        <div className="activity-quiz" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '20px' }}>{data.pergunta || 'Selecione a resposta correta:'}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.opcoes && data.opcoes.map((op, idx) => {
                    let borderColor = '#ddd';
                    let bgColor = 'white';

                    // Extract text if op is object
                    const opText = typeof op === 'object' ? op.texto : op;

                    if (submitted) {
                        // Show result state
                        if (idx === selectedOption) {
                            if (isCorrect === true) {
                                borderColor = '#28a745';
                                bgColor = '#d4edda';
                            } else if (isCorrect === false) {
                                borderColor = '#dc3545';
                                bgColor = '#f8d7da';
                            } else {
                                borderColor = '#007bff';
                                bgColor = '#cce5ff';
                            }
                        }
                        // Highlight correct answer if known and we got it wrong
                        const correctIdx = data.opcoes ? data.opcoes.findIndex(op => op.correta === true || String(op.correta) === 'true') : -1;
                        if (isCorrect === false && idx === correctIdx) {
                            borderColor = '#28a745';
                            // border only to show what was right
                        }
                    } else if (selectedOption === idx) {
                        borderColor = '#007bff';
                        bgColor = '#f0f8ff';
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            disabled={submitted || submitting}
                            style={{
                                padding: '15px',
                                textAlign: 'left',
                                borderRadius: '8px',
                                border: `2px solid ${borderColor}`,
                                backgroundColor: bgColor,
                                cursor: submitted ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: selectedOption === idx ? 'bold' : 'normal'
                            }}
                        >
                            {opText}
                        </button>
                    );
                })}
            </div>

            {!submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null || submitting}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: (selectedOption === null || submitting) ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: (selectedOption === null || submitting) ? 'not-allowed' : 'pointer',
                        width: '100%',
                        fontSize: '1rem'
                    }}
                >
                    {submitting ? 'Enviando...' : 'Confirmar Resposta'}
                </button>
            )}

            {submitted && isCorrect !== null && (
                <div style={{
                    marginTop: '20px', padding: '15px', borderRadius: '5px',
                    backgroundColor: isCorrect ? '#d4edda' : '#f8d7da',
                    color: isCorrect ? '#155724' : '#721c24'
                }}>
                    <strong>{isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta.'}</strong>
                    {!isCorrect && (
                        <div style={{ marginTop: '5px', fontSize: '0.9rem' }}>
                            {(() => {
                                const correctIdx = data.opcoes ? data.opcoes.findIndex(op => op.correta === true || String(op.correta) === 'true') : -1;
                                if (correctIdx !== -1) {
                                    const correctOp = data.opcoes[correctIdx];
                                    const correctText = typeof correctOp === 'object' ? correctOp.texto : correctOp;
                                    return `A resposta correta era: "${correctText}"`;
                                }
                                return '';
                            })()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizActivity;
