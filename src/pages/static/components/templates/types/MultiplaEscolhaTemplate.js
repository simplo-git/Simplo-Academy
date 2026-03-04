import React, { useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const MultiplaEscolhaTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {

    // Backwards compatibility initialization
    useEffect(() => {
        if (!data.questoes && data.pergunta !== undefined) {
            onChange(index, {
                ...data,
                questoes: [{ pergunta: data.pergunta, opcoes: data.opcoes || [] }],
                pergunta: undefined,
                opcoes: undefined
            });
        } else if (!data.questoes) {
            onChange(index, {
                ...data,
                questoes: [
                    {
                        pergunta: '',
                        opcoes: [
                            { texto: '', correta: false },
                            { texto: '', correta: false }
                        ]
                    }
                ]
            });
        }
    }, [data, index, onChange]);

    const questoes = data.questoes || [];

    const handleQuestionChange = (qIndex, value) => {
        const newQuestoes = [...questoes];
        newQuestoes[qIndex] = { ...newQuestoes[qIndex], pergunta: value };
        onChange(index, { ...data, questoes: newQuestoes });
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const newQuestoes = [...questoes];
        const newOpcoes = [...newQuestoes[qIndex].opcoes];
        newOpcoes[optIndex] = { ...newOpcoes[optIndex], texto: value };
        newQuestoes[qIndex] = { ...newQuestoes[qIndex], opcoes: newOpcoes };
        onChange(index, { ...data, questoes: newQuestoes });
    };

    const handleCorrectChange = (qIndex, optIndex) => {
        const newQuestoes = [...questoes];
        const newOpcoes = newQuestoes[qIndex].opcoes.map((opt, i) => ({
            ...opt,
            correta: i === optIndex
        }));
        newQuestoes[qIndex] = { ...newQuestoes[qIndex], opcoes: newOpcoes };
        onChange(index, { ...data, questoes: newQuestoes });
    };

    const addOption = (qIndex) => {
        const newQuestoes = [...questoes];
        const newOpcoes = [...newQuestoes[qIndex].opcoes, { texto: '', correta: false }];
        newQuestoes[qIndex] = { ...newQuestoes[qIndex], opcoes: newOpcoes };
        onChange(index, { ...data, questoes: newQuestoes });
    };

    const removeOption = (qIndex, optIndex) => {
        const newQuestoes = [...questoes];
        const newOpcoes = newQuestoes[qIndex].opcoes.filter((_, i) => i !== optIndex);
        newQuestoes[qIndex] = { ...newQuestoes[qIndex], opcoes: newOpcoes };
        onChange(index, { ...data, questoes: newQuestoes });
    };

    const addQuestion = () => {
        if (questoes.length >= 15) {
            alert("O limite máximo de questões neste template é 15.");
            return;
        }
        const newQuestoes = [...questoes, { pergunta: '', opcoes: [{ texto: '', correta: false }, { texto: '', correta: false }] }];
        onChange(index, { ...data, questoes: newQuestoes });
    };

    const removeQuestion = (qIndex) => {
        if (questoes.length <= 1) {
            alert("O template precisa ter pelo menos 1 questão.");
            return;
        }
        if (window.confirm("Tem certeza que deseja remover esta questão?")) {
            const newQuestoes = questoes.filter((_, i) => i !== qIndex);
            onChange(index, { ...data, questoes: newQuestoes });
        }
    };

    if (!data.questoes) return null; // Wait for initialization

    return (
        <div className="template-card">
            <div className="template-card-header">
                <div className="template-type-badge multipla-escolha">
                    <span className="type-icon">❓</span>
                    Múltipla Escolha
                </div>
                {!hideRemove && (
                    <button className="btn-remove" onClick={() => onRemove(index)} title="Remover">
                        ✕
                    </button>
                )}
            </div>

            <div className="template-card-body">
                {questoes.map((questao, qIndex) => (
                    <div key={qIndex} style={{
                        border: '1px solid #eee',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        backgroundColor: '#fdfdfd',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ margin: 0, color: '#007bff' }}>Questão {qIndex + 1}</h4>
                            {questoes.length > 1 && (
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    title="Remover questãop"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <ReactQuill
                                theme="snow"
                                value={questao.pergunta || ''}
                                onChange={(content) => handleQuestionChange(qIndex, content)}
                                placeholder="Digite a pergunta..."
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    fontFamily: 'inherit',
                                    minHeight: '80px'
                                }}
                            />
                        </div>

                        <div className="options-list">
                            {(questao.opcoes || []).map((opcao, optIndex) => (
                                <div key={optIndex} className="option-item">
                                    <label className="radio-container">
                                        <input
                                            type="radio"
                                            name={`correct-${index}-${qIndex}`}
                                            checked={opcao.correta || false}
                                            onChange={() => handleCorrectChange(qIndex, optIndex)}
                                        />
                                        <span className="radio-checkmark"></span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input option-input"
                                        placeholder={`Opção ${optIndex + 1}`}
                                        value={opcao.texto || ''}
                                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                    />
                                    {(questao.opcoes || []).length > 2 && (
                                        <button
                                            className="btn-remove-option"
                                            onClick={() => removeOption(qIndex, optIndex)}
                                            title="Remover opção"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button className="btn-add-option" onClick={() => addOption(qIndex)} style={{ marginTop: '10px' }}>
                            + Adicionar opção
                        </button>
                    </div>
                ))}

                <button
                    onClick={addQuestion}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: questoes.length >= 15 ? '#ccc' : '#e2e6ea',
                        color: '#333',
                        border: '1px solid #dae0e5',
                        borderRadius: '6px',
                        cursor: questoes.length >= 15 ? 'not-allowed' : 'pointer',
                        width: '100%',
                        fontWeight: 'bold',
                        marginBottom: '15px'
                    }}
                    disabled={questoes.length >= 15}
                >
                    + Adicionar Questão ({questoes.length}/15)
                </button>

                <div className="form-group" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={data.obrigatorio !== false} // Default to true if undefined
                            onChange={(e) => onChange(index, { ...data, obrigatorio: e.target.checked })}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">Obrigatório</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default MultiplaEscolhaTemplate;
