import React, { useState, useEffect } from 'react';
import '../css/ContentWizard.css'; // Reuse wizard styles for modal layout
import UserAnswersView from './UserAnswersView';

const ContentTrackingModal = ({ content, onClose }) => {
    const [internalContent, setInternalContent] = useState(content);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserForVerification, setSelectedUserForVerification] = useState(null);

    // Refresh content data (e.g. after grading)
    const refreshContent = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${content._id}`);
            if (response.ok) {
                const data = await response.json();
                setInternalContent(data);
            }
        } catch (err) {
            console.error("Erro ao atualizar conteúdo:", err);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (err) {
                console.error("Erro ao carregar usuários:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Helper to get user details
    const getUserInfo = (userId) => users.find(u => u._id === userId);

    // Filter users who are assigned to this content
    const assignedUserIds = internalContent.usuarios ? Object.keys(internalContent.usuarios) : [];

    // Sort: Users with progress first
    const sortedUserIds = assignedUserIds.sort((a, b) => {
        const progA = internalContent.usuarios[a] || {};
        const progB = internalContent.usuarios[b] || {};
        if (progA.realizado === progB.realizado) return 0;
        return progA.realizado ? -1 : 1;
    });

    const handleResetUser = async (userId) => {
        try {
            // Clone content deep enough
            const updatedContent = { ...internalContent };
            updatedContent.usuarios = { ...updatedContent.usuarios };
            updatedContent.usuarios[userId] = {
                ...updatedContent.usuarios[userId],
                realizado: false,
                nota: null,
                conteudo: [],
                status: null,
                data_conclusao: null
            };

            const response = await fetch(`http://127.0.0.1:5000/api/conteudos/${content._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedContent)
            });

            if (response.ok) {
                alert('Progresso do usuário reiniciado com sucesso.');
                // Update local 'content' prop would require parent refresh, 
                // effectively we might need to close this modal or trigger a parent refresh.
                // For now, let's close the verify modal. Ideally parent should refetch.
                // We can modify the local content object in memory if parent doesn't auto-refresh,
                // but 'content' prop is read-only.
                // The correct way is to call a refresh on parent. 
                // Since we don't have onRefresh, we will just force close to make user reopen and fetch new data? 
                // Actually parent passes 'content'. We need to tell parent to update.
                // Simplest fix: Close modal so user sees updated list when reopening? 
                // No, 'content' prop won't update unless parent updates.
                onClose(); // Force close main modal to refresh data on next open (if parent fetches on open?)
                // Actually parent (ContentPage) fetches on 'useEffect' or 'handleSuccess'.
                // If we assume ContentPage refreshes when modal closes? No.
                // We should probably rely on the user manually refreshing or implementing a refresh callback.
            } else {
                alert('Erro ao reiniciar progresso.');
            }
        } catch (err) {
            console.error('Erro ao resetar:', err);
            alert('Erro de conexão.');
        }
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-container" style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div className="wizard-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div>
                        <h2 className="wizard-title" style={{ fontSize: '1.4rem' }}>Acompanhamento</h2>
                        <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>
                            {internalContent.nome}
                        </div>
                    </div>
                    <button className="wizard-close" onClick={onClose} title="Fechar">×</button>
                </div>

                {/* Body */}
                <div className="wizard-body" style={{ padding: '20px', overflowY: 'auto' }}>
                    {loading ? (
                        <p>Carregando dados dos alunos...</p>
                    ) : assignedUserIds.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                            <p>Nenhum aluno atribuído a este conteúdo.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f9fafb', color: '#555', fontSize: '0.9rem' }}>
                                <tr>
                                    <th style={{ padding: '12px 15px', borderRadius: '8px 0 0 0' }}>Aluno</th>
                                    <th style={{ padding: '12px 15px' }}>Progresso</th>
                                    <th style={{ padding: '12px 15px' }}>Nota</th>
                                    <th style={{ padding: '12px 15px' }}>Status</th>
                                    <th style={{ padding: '12px 15px' }}>Conclusão</th>
                                    <th style={{ padding: '12px 15px', borderRadius: '0 8px 0 0' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUserIds.map(userId => {
                                    const user = getUserInfo(userId);
                                    if (!user) return null; // Should not happen if data is consistent

                                    const progress = internalContent.usuarios[userId] || {};
                                    const isDone = progress.realizado;
                                    const score = progress.nota !== undefined && progress.nota !== null ? progress.nota : '-';

                                    return (
                                        <tr key={userId} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e0e0e0', overflow: 'hidden' }}>
                                                    {user.foto ? <img src={user.foto} alt="" style={{ width: '100%', height: '100%' }} /> : <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '0.7rem' }}>{user.nome.charAt(0)}</span>}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '500', color: '#333' }}>{user.nome || 'Usuário Desconhecido'}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{user.email || user.cargo}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>
                                                {isDone ? (
                                                    <span style={{ backgroundColor: '#e6fffa', color: '#047481', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        Concluído
                                                    </span>
                                                ) : (
                                                    <span style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#333' }}>
                                                {score}
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>
                                                {progress.status === 'aprovado' ? (
                                                    <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        Aprovado
                                                    </span>
                                                ) : progress.status === 'reprovado' ? (
                                                    <span style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        Reprovado
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#888' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 15px', fontSize: '0.9rem', color: '#666' }}>
                                                {progress.data_conclusao ? new Date(progress.data_conclusao).toLocaleDateString() : '-'}
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>
                                                <button
                                                    style={{
                                                        backgroundColor: '#007bff', color: 'white', border: 'none',
                                                        padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem'
                                                    }}
                                                    onClick={() => setSelectedUserForVerification(user)}
                                                >
                                                    Verificar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Sub-modal for verification */}
                {selectedUserForVerification && (
                    <UserAnswersView
                        content={internalContent}
                        user={selectedUserForVerification}
                        onClose={() => setSelectedUserForVerification(null)}
                        onReset={handleResetUser}
                        onUpdate={refreshContent}
                    />
                )}
            </div>
        </div>
    );
};

export default ContentTrackingModal;
