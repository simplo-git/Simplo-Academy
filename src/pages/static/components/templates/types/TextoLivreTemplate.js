import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

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
                    <ReactQuill
                        theme="snow"
                        value={data.enunciado || ''}
                        onChange={(content) => handleChange('enunciado', content)}
                        placeholder="Digite o enunciado ou pergunta..."
                        style={{ backgroundColor: 'white', marginBottom: '10px' }}
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
                            placeholder="9000"
                            min="0"
                            value={data.maxCaracteres || ''}
                            onChange={(e) => handleChange('maxCaracteres', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '20px' }}>
                    <label className="form-label">Orientações para resposta (opcional)</label>
                    <ReactQuill
                        theme="snow"
                        value={data.orientacoes || ''}
                        onChange={(content) => handleChange('orientacoes', content)}
                        placeholder="Ex: Fundamente sua resposta com exemplos práticos..."
                        style={{ backgroundColor: 'white', marginBottom: '10px' }}
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
