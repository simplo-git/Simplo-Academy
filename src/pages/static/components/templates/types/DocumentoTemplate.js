import React, { useRef } from 'react';

const DocumentoTemplate = ({ data, onChange, onRemove, index, hideRemove }) => {
    const fileInputRef = useRef(null);

    const handleChange = (field, value) => {
        onChange(index, { ...data, [field]: value });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        if (!validTypes.includes(file.type)) {
            alert('Por favor, selecione um documento válido (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Devido a limitações do banco de dados, o arquivo deve ter no máximo 10MB.');
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

    const getFileIcon = (type) => {
        if (type?.includes('pdf')) return '📄';
        if (type?.includes('word') || type?.includes('document')) return '📝';
        if (type?.includes('excel') || type?.includes('sheet')) return '📊';
        if (type?.includes('powerpoint') || type?.includes('presentation')) return '📽️';
        return '📁';
    };

    return (
        <div className="template-card">
            <div className="template-card-header">
                <div className="template-type-badge documento">
                    <span className="type-icon">📄</span>
                    Documento
                </div>
                {!hideRemove && (
                    <button className="btn-remove" onClick={() => onRemove(index)} title="Remover">
                        ✕
                    </button>
                )}
            </div>

            <div className="template-card-body">
                <div className="form-group">
                    <label className="form-label">Título do Documento</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Manual do colaborador"
                        value={data.titulo || ''}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Breve descrição do documento..."
                        rows={2}
                        value={data.descricao || ''}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Arquivo do Documento</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
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
                                <span className="upload-icon">📁</span>
                                <p>Clique para selecionar um documento</p>
                                <span className="upload-hint">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX até 10MB</span>
                            </div>
                        </div>
                    ) : (
                        <div className="file-preview">
                            <div className="file-info">
                                <span className="file-icon">{getFileIcon(data.tipoArquivo)}</span>
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

                <div className="form-group checkbox-group">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={data.permitirDownload || false}
                            onChange={(e) => handleChange('permitirDownload', e.target.checked)}
                        />
                        <span className="checkbox-checkmark"></span>
                        Permitir download
                    </label>
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

export default DocumentoTemplate;
