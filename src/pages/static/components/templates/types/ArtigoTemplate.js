import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ArtigoTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const handleChange = (field, value) => {
        onChange(index, { ...data, [field]: value });
    };

    return (
        <div className="template-card">
            <div className="template-card-header">
                <div className="template-type-badge artigo">
                    <span className="type-icon">📰</span>
                    Artigo
                </div>
                {!hideRemove && (
                    <button className="btn-remove" onClick={() => onRemove(index)} title="Remover">
                        ✕
                    </button>
                )}
            </div>

            <div className="template-card-body">
                <div className="form-group">
                    <label className="form-label">Título do Artigo</label>
                    <input
                        type="text"
                        className="form-input title-input"
                        placeholder="Digite o título..."
                        value={data.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '25px' }}>


                    <label className="form-label">Conteúdo do Artigo</label>
                    <ReactQuill
                        theme="snow"
                        value={data.conteudo || ''}
                        onChange={(content) => handleChange('conteudo', content)}
                        placeholder="Escreva o conteúdo do artigo aqui..."
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            minHeight: '200px'
                        }}
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
                        Leitura obrigatória
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ArtigoTemplate;
