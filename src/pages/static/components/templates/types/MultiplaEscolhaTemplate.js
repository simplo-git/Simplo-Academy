import React from 'react';

const MultiplaEscolhaTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const handleQuestionChange = (e) => {
        onChange(index, { ...data, pergunta: e.target.value });
    };

    const handleOptionChange = (optIndex, value) => {
        const newOpcoes = [...(data.opcoes || [])];
        newOpcoes[optIndex] = { ...newOpcoes[optIndex], texto: value };
        onChange(index, { ...data, opcoes: newOpcoes });
    };

    const handleCorrectChange = (optIndex) => {
        const newOpcoes = (data.opcoes || []).map((opt, i) => ({
            ...opt,
            correta: i === optIndex
        }));
        onChange(index, { ...data, opcoes: newOpcoes });
    };

    const addOption = () => {
        const newOpcoes = [...(data.opcoes || []), { texto: '', correta: false }];
        onChange(index, { ...data, opcoes: newOpcoes });
    };

    const removeOption = (optIndex) => {
        const newOpcoes = (data.opcoes || []).filter((_, i) => i !== optIndex);
        onChange(index, { ...data, opcoes: newOpcoes });
    };

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
                <div className="form-group">
                    <input
                        type="text"
                        className="form-input question-input"
                        placeholder="Digite a pergunta..."
                        value={data.pergunta || ''}
                        onChange={handleQuestionChange}
                    />
                </div>

                <div className="options-list">
                    {(data.opcoes || []).map((opcao, optIndex) => (
                        <div key={optIndex} className="option-item">
                            <label className="radio-container">
                                <input
                                    type="radio"
                                    name={`correct-${index}`}
                                    checked={opcao.correta || false}
                                    onChange={() => handleCorrectChange(optIndex)}
                                />
                                <span className="radio-checkmark"></span>
                            </label>
                            <input
                                type="text"
                                className="form-input option-input"
                                placeholder={`Opção ${optIndex + 1}`}
                                value={opcao.texto || ''}
                                onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                            />
                            {(data.opcoes || []).length > 2 && (
                                <button
                                    className="btn-remove-option"
                                    onClick={() => removeOption(optIndex)}
                                    title="Remover opção"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button className="btn-add-option" onClick={addOption}>
                    + Adicionar opção
                </button>
            </div>
        </div>
    );
};

export default MultiplaEscolhaTemplate;
