import React from 'react';

const UploadTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const handleChange = (field, value) => {
        onChange(index, { ...data, [field]: value });
    };

    const handleFileTypeToggle = (type) => {
        const current = data.tiposAceitos || [];
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        handleChange('tiposAceitos', updated);
    };

    const fileTypes = [
        { value: 'pdf', label: 'PDF', icon: '📄' },
        { value: 'doc', label: 'Word', icon: '📝' },
        { value: 'xls', label: 'Excel', icon: '📊' },
        { value: 'ppt', label: 'PowerPoint', icon: '📽️' },
        { value: 'img', label: 'Imagens', icon: '🖼️' },
        { value: 'zip', label: 'Arquivos ZIP', icon: '📦' }
    ];

    return (
        <div className="template-card">
            <div className="template-card-header">
                <div className="template-type-badge upload">
                    <span className="type-icon">📤</span>
                    Upload de Arquivo
                </div>
                {!hideRemove && (
                    <button className="btn-remove" onClick={() => onRemove(index)} title="Remover">
                        ✕
                    </button>
                )}
            </div>

            <div className="template-card-body">
                <div className="form-group">
                    <label className="form-label">Título da Atividade</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Envio do trabalho final"
                        value={data.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Instruções para upload</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Descreva o que deve ser enviado..."
                        rows={3}
                        value={data.instrucoes || ''}
                        onChange={(e) => handleChange('instrucoes', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Tipos de arquivo aceitos</label>
                    <div className="file-types-grid">
                        {fileTypes.map(type => (
                            <label key={type.value} className="file-type-option">
                                <input
                                    type="checkbox"
                                    checked={(data.tiposAceitos || []).includes(type.value)}
                                    onChange={() => handleFileTypeToggle(type.value)}
                                />
                                <span className="file-type-card">
                                    <span className="file-type-icon">{type.icon}</span>
                                    <span className="file-type-label">{type.label}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Tamanho máximo (MB)</label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="10"
                        min="1"
                        max="100"
                        value={data.tamanhoMaximo || ''}
                        onChange={(e) => handleChange('tamanhoMaximo', e.target.value)}
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
                        Upload obrigatório
                    </label>
                </div>
            </div>
        </div>
    );
};

export default UploadTemplate;
