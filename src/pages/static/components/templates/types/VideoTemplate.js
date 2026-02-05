import React, { useRef } from 'react';

const VideoTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const fileInputRef = useRef(null);

    const handleChange = (field, value) => {
        onChange(index, { ...data, [field]: value });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
            alert('Por favor, selecione um arquivo de vídeo válido (MP4, WebM, OGG, MOV)');
            return;
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('O arquivo é muito grande. Tamanho máximo: 50MB. Para vídeos maiores, use URL externa.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            onChange(index, {
                ...data,
                arquivo: event.target.result,
                nomeArquivo: file.name,
                tipoArquivo: file.type,
                tamanhoArquivo: file.size
            });
        };
        reader.readAsDataURL(file);
    };

    const removeFile = () => {
        onChange(index, {
            ...data,
            arquivo: null,
            nomeArquivo: null,
            tipoArquivo: null,
            tamanhoArquivo: null,
            url: null
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="template-card">
            <div className="template-card-header">
                <div className="template-type-badge video">
                    <span className="type-icon">🎬</span>
                    Vídeo
                </div>
                {!hideRemove && (
                    <button className="btn-remove" onClick={() => onRemove(index)} title="Remover">
                        ✕
                    </button>
                )}
            </div>

            <div className="template-card-body">
                <div className="form-group">
                    <label className="form-label">Título do Vídeo</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Introdução ao módulo"
                        value={data.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Arquivo de Vídeo</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />

                    {!data.arquivo && !data.url ? (
                        <div
                            className="upload-area"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="upload-placeholder">
                                <span className="upload-icon">🎬</span>
                                <p>Clique para selecionar um vídeo</p>
                                <span className="upload-hint">MP4, WebM, OGG, MOV até 50MB</span>
                            </div>
                        </div>
                    ) : (
                        <div className="file-preview">
                            <div className="file-info">
                                <span className="file-icon">🎬</span>
                                <div className="file-details">
                                    <span className="file-name">{data.nomeArquivo}</span>
                                    <span className="file-size">{formatFileSize(data.tamanhoArquivo)}</span>
                                </div>
                                <button
                                    className="btn-remove-file"
                                    onClick={removeFile}
                                    title="Remover arquivo"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Descrição (opcional)</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Descreva o conteúdo do vídeo..."
                        rows={3}
                        value={data.descricao || ''}
                        onChange={(e) => handleChange('descricao', e.target.value)}
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
                        Assistir completamente é obrigatório
                    </label>
                </div>

                <div className="form-group">
                    <label className="form-label">Capa do Vídeo (Thumbnail)</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="URL da imagem de capa (opcional)"
                        value={data.thumbnail || ''}
                        onChange={(e) => handleChange('thumbnail', e.target.value)}
                    />
                    <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#666' }}>
                        Cole a URL de uma imagem para ser exibida antes do vídeo iniciar.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoTemplate;
