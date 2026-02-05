import React, { useState } from 'react';

const DocumentActivity = ({ data, onAnswer, activityId, currentAnswer }) => {
    const [viewed, setViewed] = useState(!!currentAnswer);

    const handleViewDocument = () => {
        // Open document in new tab
        if (data.url) {
            window.open(data.url, '_blank');
        }

        // Mark as completed if not already
        if (!viewed && !currentAnswer) {
            setViewed(true);
            onAnswer({
                template_id: activityId,
                tipo: 'documento',
                resposta: 'Documento Visualizado',
                correta: true,
                nota: 100,
                realizado: true
            });
        }
    };

    return (
        <div className="activity-container document-activity" style={{
            padding: '30px',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #eee'
        }}>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '10px' }}>📄</div>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{data.titulo}</h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>{data.descricao}</p>
            </div>

            {data.tipoArquivo && (
                <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#888' }}>
                    Tipo: {data.tipoArquivo.split('/')[1]?.toUpperCase() || 'Arquivo'}
                    {data.tamanhoArquivo ? ` • ${(data.tamanhoArquivo / 1024).toFixed(1)} KB` : ''}
                </div>
            )}

            <div style={{ marginTop: '30px' }}>
                <button
                    onClick={handleViewDocument}
                    className="btn-primary"
                    style={{
                        padding: '12px 24px',
                        fontSize: '1.1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        backgroundColor: viewed || currentAnswer ? '#28a745' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {viewed || currentAnswer ? '✅ Documento Visualizado' : '👀 Visualizar Documento'}
                </button>
            </div>

            {(viewed || currentAnswer) && (
                <div style={{ marginTop: '20px', color: '#28a745', fontSize: '0.9rem' }}>
                    Atividade concluída! Você pode acessar o documento novamente a qualquer momento.
                </div>
            )}
        </div>
    );
};

export default DocumentActivity;
