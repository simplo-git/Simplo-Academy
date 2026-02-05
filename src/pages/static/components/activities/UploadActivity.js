import React, { useState, useEffect } from 'react';

const UploadActivity = ({ data, onAnswer, currentAnswer, activityId }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [base64File, setBase64File] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null); // URL returned from backend
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentAnswer) {
            setSubmitted(true);
            if (currentAnswer.resposta && currentAnswer.resposta.startsWith('http')) {
                setUploadedUrl(currentAnswer.resposta);
            }
        }
    }, [currentAnswer]);

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setError('');
            setUploadedUrl(null); // Reset if new file selected

            // Convert to Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64File(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !base64File) return;

        setUploading(true);
        setError('');

        try {
            // New route as requested
            const response = await fetch('http://127.0.0.1:5000/api/activity-templates/document-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file: base64File,
                    filename: selectedFile.name
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                setUploadedUrl(result.url); // Assume result.url contains the file URL
            } else {
                setError(result.message || "Erro ao fazer upload do arquivo.");
            }
        } catch (err) {
            console.error("Erro no upload:", err);
            setError("Erro de conexão ao enviar arquivo.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!uploadedUrl) return;

        setSubmitting(true);
        try {
            await onAnswer({
                template_id: activityId,
                tipo: 'upload',
                resposta: uploadedUrl, // The answer is the FILE URL
                realizado: false,
                nota: null
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Erro no envio da resposta:", err);
            setError("Erro ao finalizar atividade.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="activity-upload" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>{data.titulo || 'Tarefa de Envio de Arquivo'}</h3>

            {data.instrucoes && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderLeft: '4px solid #007bff' }}>
                    <p style={{ margin: 0, color: '#555' }}>{data.instrucoes}</p>
                </div>
            )}

            {!submitted ? (
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Envie seu trabalho:</p>
                    <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '30px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept={data.tiposAceitos ? data.tiposAceitos.map(t => `.${t}`).join(',') : '*'}
                        />
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                            {selectedFile ? (
                                <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                                    📄 {selectedFile.name}
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>☁️</div>
                                    <span style={{ color: '#007bff', textDecoration: 'underline' }}>Clique para selecionar um arquivo</span>
                                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                                        (Formatos aceitos: {data.tiposAceitos ? data.tiposAceitos.join(', ') : 'Todos'})
                                    </div>
                                </div>
                            )}
                        </label>
                    </div>
                    {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
                </div>
            ) : (
                <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', color: '#155724', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>✅ Arquivo Enviado</h4>
                    <p>Você já enviou uma resposta para esta atividade.</p>
                    {currentAnswer && currentAnswer.resposta && (
                        <div style={{ marginTop: '10px' }}>
                            <a href={currentAnswer.resposta} target="_blank" rel="noopener noreferrer" style={{ color: '#155724', textDecoration: 'underline' }}>
                                📄 Visualizar Arquivo Enviado
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Actions Area */}
            {!submitted && selectedFile && !uploadedUrl && (
                <button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    style={{
                        backgroundColor: uploading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        display: 'block',
                        width: '100%',
                        marginTop: '15px'
                    }}
                >
                    {uploading ? 'Fazendo Upload...' : '1. Fazer Upload do Arquivo'}
                </button>
            )}

            {!submitted && uploadedUrl && (
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #c3e6cb', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                    <p style={{ color: '#155724', margin: '0 0 10px 0' }}>✅ Upload concluído com sucesso!</p>
                    <button
                        onClick={handleSubmitAnswer}
                        disabled={submitting}
                        style={{
                            backgroundColor: submitting ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            display: 'block',
                            width: '100%'
                        }}
                    >
                        {submitting ? 'Salvando...' : '2. Enviar Atividade / Finalizar'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UploadActivity;
