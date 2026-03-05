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
    const [searchTerm, setSearchTerm] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = React.useRef(null);

    const [showArrows1, setShowArrows1] = useState(false);
    const [showArrows2, setShowArrows2] = useState(false);

    const checkScroll = () => {
        const c1 = document.getElementById('carousel-level1');
        if (c1) setShowArrows1(c1.scrollWidth > c1.clientWidth);

        const c2 = document.getElementById('carousel-level2');
        if (c2) setShowArrows2(c2.scrollWidth > c2.clientWidth);
    };

    const scrollContainer = (id, direction) => {
        const container = document.getElementById(id);
        if (container) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (!loading) {
            setTimeout(checkScroll, 100);
        }
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [loading, contents]);

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
                const cRes = await fetch('http://192.168.0.17:9000/api/conteudos');
                const cData = await cRes.json();

                // Fetch Roles (Setores) for name mapping if needed
                const rRes = await fetch('http://192.168.0.17:9000/api/roles');
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
        const rawSectors = content.setores || content.setor || [];
        const contentSectors = Array.isArray(rawSectors) ? rawSectors : [rawSectors];

        return contentSectors.some(s => {
            const sId = typeof s === 'object' ? s.id || s._id : s;
            return userSectorIds.includes(sId);
        });
    };

    // Filter Contents
    const term = searchTerm.toLowerCase();
    const matchesSearch = (c) => !term || (c.nome && c.nome.toLowerCase().includes(term));
    const myContentsLevel1 = contents.filter(c => isContentForUser(c) && matchesSearch(c) && (!c.nivel || c.nivel == 1));
    const myContentsLevel2Plus = contents.filter(c => isContentForUser(c) && matchesSearch(c) && c.nivel >= 2);

    return (
        <div className="home-container">
            <Header />

            {/* Main Content */}
            <main className="main-content">
                {/* Greeting + Search Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', gap: '12px' }}>
                    {user && (
                        <div style={{ color: '#555', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                            Olá, <strong>{user.nome}</strong>! Aqui estão seus treinamentos.
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                        {/* Animated Search Input */}
                        <div style={{
                            overflow: 'hidden',
                            width: searchOpen ? '320px' : '0px',
                            opacity: searchOpen ? 1 : 0,
                            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease'
                        }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Pesquisar conteúdos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 14px',
                                    borderRadius: '20px',
                                    border: '1px solid #ccc',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#007bff'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#ccc'; }}
                            />
                        </div>

                        {/* Search Toggle Button */}
                        <button
                            onClick={() => {
                                const willOpen = !searchOpen;
                                setSearchOpen(willOpen);
                                if (willOpen) {
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                } else {
                                    setSearchTerm('');
                                }
                            }}
                            title={searchOpen ? 'Fechar busca' : 'Pesquisar'}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                border: searchOpen ? '2px solid #007bff' : '1px solid #ddd',
                                background: searchOpen ? '#e3f2fd' : 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: searchOpen ? '0 0 0 3px rgba(0,123,255,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
                                flexShrink: 0,
                                transform: searchOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}
                        >
                            {searchOpen ? '✕' : '🔍'}
                        </button>
                    </div>
                </div>

                {/* Section: Comece por Aqui */}
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-icon">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2.06 11L15 15.28 12.06 17l.78-3.33-2.59-2.24 3.41-.29L15 8l1.34 3.14 3.41.29-2.59 2.24.78 3.33z" />
                            </svg>
                        </span>
                        Comece por Aqui (Nível 1) <span style={{ marginLeft: '8px', backgroundColor: '#e3f2fd', color: '#1976d2', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>{myContentsLevel1.length}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {showArrows1 && (
                            <button
                                onClick={() => scrollContainer('carousel-level1', 'left')}
                                style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
                            </button>
                        )}
                        <div id="carousel-level1" className="courses-wrapper">
                            {loading ? <p>Carregando...</p> : (
                                myContentsLevel1.length > 0
                                    ? myContentsLevel1.map(content => (
                                        <div key={content._id} style={{ flex: '0 0 auto' }}>
                                            <ContentCard
                                                content={content}
                                                onClick={setSelectedContent}
                                            />
                                        </div>
                                    ))
                                    : <p style={{ color: '#888', fontStyle: 'italic', padding: '20px' }}>Nenhum conteúdo introdutório encontrado para seu setor.</p>
                            )}
                        </div>
                        {showArrows1 && (
                            <button
                                onClick={() => scrollContainer('carousel-level1', 'right')}
                                style={{ position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                            </button>
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
                        Cursos Disponíveis (Avançado) <span style={{ marginLeft: '8px', backgroundColor: '#e8f5e9', color: '#388e3c', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>{myContentsLevel2Plus.length}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {showArrows2 && (
                            <button
                                onClick={() => scrollContainer('carousel-level2', 'left')}
                                style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg>
                            </button>
                        )}
                        <div id="carousel-level2" className="courses-wrapper">
                            {loading ? <p>Carregando...</p> : (
                                myContentsLevel2Plus.length > 0
                                    ? myContentsLevel2Plus.map(content => (
                                        <div key={content._id} style={{ flex: '0 0 auto' }}>
                                            <ContentCard
                                                content={content}
                                                onClick={setSelectedContent}
                                            />
                                        </div>
                                    ))
                                    : <p style={{ color: '#888', fontStyle: 'italic', padding: '20px' }}>Nenhum curso avançado disponível no momento.</p>
                            )}
                        </div>
                        {showArrows2 && (
                            <button
                                onClick={() => scrollContainer('carousel-level2', 'right')}
                                style={{ position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                            </button>
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
