import React, { useState } from 'react';

const UserAnswersView = ({ content, user, onClose, onReset, onUpdate }) => {
    const [isResetting, setIsResetting] = useState(false);
    const [textModalContent, setTextModalContent] = useState(null);
    const [gradeInput, setGradeInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userProgress = content.usuarios[user._id] || {};
    const answers = userProgress.conteudo || []; // Array of answers

    const handleGrade = async (status) => {
        if (!gradeInput && status === 'aprovado') {
            alert("Por favor, informe a not para aprovar.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${content._id}/grade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user._id,
                    nota: parseFloat(gradeInput),
                    status: status
                })
            });

            if (response.ok) {
                alert(`Usuário ${status === 'aprovado' ? 'aprovado' : 'reprovado'} com sucesso!`);
                if (onUpdate) onUpdate();
                onClose(); // Close to refresh/reset
            } else {
                alert("Erro ao aplicar correção.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm(`Tem certeza que deseja limpar as respostas e reiniciar o progresso de ${user.nome}?`)) {
            setIsResetting(true);
            await onReset(user._id);
            setIsResetting(false);
            onClose();
        }
    };

    // Helper to format answer display
    const renderAnswerValue = (ans) => {
        if (ans === null || ans === undefined) return '-';
        if (typeof ans === 'boolean') return ans ? 'Verdadeiro' : 'Falso';
        if (typeof ans === 'object') return JSON.stringify(ans);
        return ans.toString();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100 // Higher than tracking modal
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Respostas de {user.nome}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '0.9rem' }}>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', flex: 1 }}>
                            <strong>Status:</strong> {userProgress.status === 'aprovado' ? '✅ Aprovado' : userProgress.status === 'reprovado' ? '❌ Reprovado' : '⏳ Pendente'}
                        </div>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', flex: 1 }}>
                            <strong>Nota:</strong> {userProgress.nota !== null ? userProgress.nota : '-'}
                        </div>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', flex: 1 }}>
                            <strong>Conclusão:</strong> {userProgress.data_conclusao ? new Date(userProgress.data_conclusao).toLocaleString() : '-'}
                        </div>
                    </div>

                    {answers.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '20px' }}>Nenhuma resposta registrada.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: '#f1f3f5', color: '#495057' }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Resposta</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Correta?</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {answers.map((ans, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            {ans.tipo === 'multipla_escolha' ? '❓ Múltipla Escolha' :
                                                ans.tipo === 'video' ? '🎬 Vídeo' :
                                                    ans.tipo === 'upload' ? '📤 Upload' :
                                                        ans.tipo === 'texto_livre' ? '📝 Texto' : ans.tipo}
                                        </td>
                                        <td style={{ padding: '10px', maxWidth: '250px', wordBreak: 'break-word' }}>
                                            {ans.tipo === 'video' ? (
                                                'Vídeo assistido'
                                            ) : ans.tipo === 'texto_livre' ? (
                                                <button
                                                    onClick={() => setTextModalContent(ans.resposta)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    📖 Ler resposta
                                                </button>
                                            ) : ans.tipo === 'upload' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <a href={ans.resposta} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#007bff', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '230px' }}>
                                                        {ans.resposta}
                                                    </a>
                                                    <a
                                                        href={ans.resposta}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            padding: '4px 10px',
                                                            backgroundColor: '#6c757d',
                                                            color: 'white',
                                                            textDecoration: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            width: 'fit-content'
                                                        }}
                                                    >
                                                        ⬇️ Baixar
                                                    </a>
                                                </div>
                                            ) : (
                                                renderAnswerValue(ans.resposta)
                                            )}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            {ans.correta === true ? <span style={{ color: 'green' }}>✓</span> :
                                                ans.correta === false ? <span style={{ color: 'red' }}>✗</span> :
                                                    <span style={{ color: '#aaa' }}>-</span>}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                                            {ans.data_resposta ? new Date(ans.data_resposta).toLocaleTimeString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {userProgress.status !== 'aprovado' && content.correcao !== 'automatica' && (
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <h4 style={{ marginTop: 0, color: '#333' }}>Avaliação Manual</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>Nota (0.0 - 10.0)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(e.target.value)}
                                    style={{
                                        width: '30%',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                    placeholder="Nota"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                                <button
                                    onClick={() => handleGrade('aprovado')}
                                    disabled={isSubmitting}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        opacity: isSubmitting ? 0.7 : 1
                                    }}
                                >
                                    ✅ Aprovar
                                </button>
                                <button
                                    onClick={() => handleGrade('reprovado')}
                                    disabled={isSubmitting}
                                    style={{
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        opacity: isSubmitting ? 0.7 : 1
                                    }}
                                >
                                    ❌ Reprovar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {userProgress.status === 'reprovado' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <button
                            onClick={handleReset}
                            disabled={isResetting}
                            style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: isResetting ? 0.7 : 1
                            }}
                        >
                            {isResetting ? 'Limpando...' : '⚠️ Limpar Tentativa / Reiniciar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal for Reading Text Answer */}
            {textModalContent && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1200, // Higher than UserAnswersView (1100)
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }} onClick={() => setTextModalContent(null)}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '25px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Resposta do Aluno</h3>
                            <button onClick={() => setTextModalContent(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6', color: '#444', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px', border: '1px solid #eee' }}>
                            {textModalContent}
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button
                                onClick={() => setTextModalContent(null)}
                                style={{
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAnswersView;
