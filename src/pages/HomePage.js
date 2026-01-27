import React from 'react';
import './static/css/HomePage.css';
import Header from './static/components/Header';

function HomePage() {
    return (
        <div className="home-container">
            <Header />

            {/* Main Content */}
            <main className="main-content">

                {/* Section: Comece por Aqui */}
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-icon">
                            {/* Archive/Box Icon */}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2.06 11L15 15.28 12.06 17l.78-3.33-2.59-2.24 3.41-.29L15 8l1.34 3.14 3.41.29-2.59 2.24.78 3.33z" />
                            </svg>
                        </span>
                        Comece por Aqui
                    </div>
                    <div className="courses-wrapper">
                        Ainda sem cursos
                    </div>
                </div>

                {/* Section: Cursos Disponíveis */}
                <div className="section-container">
                    <div className="section-header">
                        <span className="section-icon">
                            {/* Video Icon */}
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                        </span>
                        Cursos Disponíveis
                    </div>
                    <div className="courses-wrapper">
                        Ainda sem cursos
                    </div>
                </div>

            </main>
        </div>
    );
}

export default HomePage;
