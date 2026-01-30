import React from 'react';

const ArtigoTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const handleChange = (field, value) => {
        onChange(index, { ...data, [field]: value });
    };

    const applyFormatting = (format) => {
        const textarea = document.getElementById(`artigo-content-${index}`);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = data.conteudo || '';
        const selectedText = text.substring(start, end);

        let formattedText = '';
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'heading':
                formattedText = `\n## ${selectedText}`;
                break;
            case 'list':
                formattedText = `\n- ${selectedText}`;
                break;
            case 'link':
                formattedText = `[${selectedText}](url)`;
                break;
            default:
                formattedText = selectedText;
        }

        const newText = text.substring(0, start) + formattedText + text.substring(end);
        handleChange('conteudo', newText);
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

                <div className="form-group">
                    <label className="form-label">Resumo (opcional)</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Breve resumo do artigo..."
                        rows={2}
                        value={data.resumo || ''}
                        onChange={(e) => handleChange('resumo', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Conteúdo do Artigo</label>
                    <div className="editor-toolbar">
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => applyFormatting('bold')}
                            title="Negrito"
                        >
                            <strong>B</strong>
                        </button>
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => applyFormatting('italic')}
                            title="Itálico"
                        >
                            <em>I</em>
                        </button>
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => applyFormatting('heading')}
                            title="Título"
                        >
                            H
                        </button>
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => applyFormatting('list')}
                            title="Lista"
                        >
                            ☰
                        </button>
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => applyFormatting('link')}
                            title="Link"
                        >
                            🔗
                        </button>
                    </div>
                    <textarea
                        id={`artigo-content-${index}`}
                        className="form-textarea artigo-editor"
                        placeholder="Escreva o conteúdo do artigo aqui...

Você pode usar markdown para formatação:
**texto em negrito**
*texto em itálico*
## Títulos
- Listas"
                        rows={12}
                        value={data.conteudo || ''}
                        onChange={(e) => handleChange('conteudo', e.target.value)}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group half">
                        <label className="form-label">Tempo de leitura estimado</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ex: 5 min"
                            value={data.tempoLeitura || ''}
                            onChange={(e) => handleChange('tempoLeitura', e.target.value)}
                        />
                    </div>
                    <div className="form-group half">
                        <label className="form-label">Autor (opcional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Nome do autor"
                            value={data.autor || ''}
                            onChange={(e) => handleChange('autor', e.target.value)}
                        />
                    </div>
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
