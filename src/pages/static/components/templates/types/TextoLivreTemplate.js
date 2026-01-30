import React from 'react';

const TextoLivreTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const handleChange = (field, value) => {
        onChange(index, { ...data, [field]: value });
    };

    return (
        <div className="template-card">
            <div className="template-card-header">
                <div className="template-type-badge texto-livre">
                    <span className="type-icon">📝</span>
                    Texto Livre
                </div>
                {!hideRemove && (
                    <button className="btn-remove" onClick={() => onRemove(index)} title="Remover">
                        ✕
                    </button>
                )}
            </div>

            <div className="template-card-body">
                <div className="form-group">
                    <label className="form-label">Enunciado da Atividade</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Digite o enunciado ou pergunta..."
                        rows={4}
                        value={data.enunciado || ''}
                        onChange={(e) => handleChange('enunciado', e.target.value)}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group half">
                        <label className="form-label">Mínimo de caracteres</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="100"
                            min="0"
                            value={data.minCaracteres || ''}
                            onChange={(e) => handleChange('minCaracteres', e.target.value)}
                        />
                    </div>
                    <div className="form-group half">
                        <label className="form-label">Máximo de caracteres</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="5000"
                            min="0"
                            value={data.maxCaracteres || ''}
                            onChange={(e) => handleChange('maxCaracteres', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Orientações para resposta (opcional)</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Ex: Fundamente sua resposta com exemplos práticos..."
                        rows={2}
                        value={data.orientacoes || ''}
                        onChange={(e) => handleChange('orientacoes', e.target.value)}
                    />
                </div>

                <div className="form-group checkbox-group">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={data.obrigatorio || false}
                            onChange={(e) => handleChange('obrigatorio', e.target.checked)}
                        />
                        <span className="checkbox-checkmark"></span>
                        Resposta obrigatória
                    </label>
                </div>
            </div>
        </div>
    );
};

export default TextoLivreTemplate;
