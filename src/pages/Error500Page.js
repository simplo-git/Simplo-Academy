import React from 'react';
import { useNavigate } from 'react-router-dom';

const Error500Page = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '50px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '72px', color: '#dc3545', margin: '0 0 20px 0' }}>500</h1>
                <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px' }}>Erro Interno do Servidor</h2>
                <p style={{ color: '#666', marginBottom: '30px' }}>Ocorreu um problema no nosso servidor. Tente novamente mais tarde.</p>
                <button
                    onClick={() => navigate('/home')}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    Voltar para o Início
                </button>
            </div>
        </div>
    );
};

export default Error500Page;
