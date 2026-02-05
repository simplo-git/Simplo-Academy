import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './static/components/Header';
import ContentPlayerModal from './static/components/ContentPlayerModal';
import ContentCard from './static/components/ContentCard';
import { getUser } from '../auth/auth';
import './static/css/HomePage.css';

function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [contents, setContents] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState(null);

    useEffect(() => {
        const loggedUser = getUser();
        if (loggedUser) {
            setUser(loggedUser);
        } else {
            console.warn("Usuário não encontrado na sessão.");
            // navigate('/login'); // Optional: redirect if crucial
        }

        const fetchData = async () => {
            try {
                // Fetch Contents
                const cRes = await fetch('http://127.0.0.1:5000/api/conteudos');
                const cData = await cRes.json();

                // Fetch Roles (Setores) for name mapping if needed
                const rRes = await fetch('http://127.0.0.1:5000/api/roles');
                const rData = await rRes.json();

                setContents(cRes.ok ? cData : []);
                setRoles(rRes.ok ? rData : []);
            } catch (err) {
                console.error("Erro ao carregar dados", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to check if content is assigned to user's sector OR explicitly to the user
    const isContentForUser = (content) => {
        if (!user) return false;

        // 1. Check if user is explicitly assigned in content.usuarios
        // user._id is standard, but fallback to user.id just in case
        const userId = user._id || user.id;
        if (content.usuarios && content.usuarios[userId]) {
            return true;
        }

        // 2. Check if content is assigned to user's sector
        if (!user.setor && !user.setores) return false;

        // Handle user.setor being an array of objects (as reported by user) or single object/ID
        // Normalize user sectors to an array of IDs
        let userSectorIds = [];
        const userSetor = user.setor || user.setores;

        if (Array.isArray(userSetor)) {
            userSectorIds = userSetor.map(s => (typeof s === 'object' ? s.id || s._id : s));
        } else if (typeof userSetor === 'object') {
            userSectorIds = [userSetor.id || userSetor._id];
        } else {
            userSectorIds = [userSetor];
        }

        // Content sectors
        const contentSectors = content.setores || (content.setor ? [content.setor] : []);

        return contentSectors.some(s => {
            const sId = typeof s === 'object' ? s.id || s._id : s;
            return userSectorIds.includes(sId);
        });
    };

    // Filter Contents
    const myContentsLevel1 = contents.filter(c => isContentForUser(c) && (!c.nivel || c.nivel == 1));
    const myContentsLevel2Plus = contents.filter(c => isContentForUser(c) && c.nivel >= 2);

    return (
        <div className="home-container">
            <Header />

            {/* Main Content */}
            <main className="main-content">
                {user && (
                    <div style={{ marginBottom: '20px', color: '#555' }}>
                        Olá, <strong>{user.nome}</strong>! Aqui estão seus treinamentos.
                    </div>
                )}

                {/* Section: Comece por Aqui */}
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2.06 11L15 15.28 12.06 17l.78-3.33-2.59-2.24 3.41-.29L15 8l1.34 3.14 3.41.29-2.59 2.24.78 3.33z" />
                            </svg>
                        </span>
                        Comece por Aqui (Nível 1)
                    </div>
                    <div className="courses-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {loading ? <p>Carregando...</p> : (
                            myContentsLevel1.length > 0
                                ? myContentsLevel1.map(content => (
                                    <ContentCard
                                        key={content._id}
                                        content={content}
                                        onClick={setSelectedContent}
                                    />
                                ))
                                : <p style={{ color: '#888', fontStyle: 'italic' }}>Nenhum conteúdo introdutório encontrado para seu setor.</p>
                        )}
                    </div>
                </div>

                {/* Section: Cursos Disponíveis */}
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                        </span>
                        Cursos Disponíveis (Avançado)
                    </div>
                    <div className="courses-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {loading ? <p>Carregando...</p> : (
                            myContentsLevel2Plus.length > 0
                                ? myContentsLevel2Plus.map(content => (
                                    <ContentCard
                                        key={content._id}
                                        content={content}
                                        onClick={setSelectedContent}
                                    />
                                ))
                                : <p style={{ color: '#888', fontStyle: 'italic' }}>Nenhum curso avançado disponível no momento.</p>
                        )}
                    </div>
                </div>

            </main>

            {selectedContent && (
                <ContentPlayerModal
                    content={selectedContent}
                    onClose={() => {
                        setSelectedContent(null);
                        // Refresh data to reflect progress
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}

export default HomePage;
