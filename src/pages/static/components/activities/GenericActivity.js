import React from 'react';

const GenericActivity = ({ type, data }) => {
    return (
        <div className="activity-generic" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Atividade: {type}</h3>
            <pre style={{ textAlign: 'left', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', display: 'inline-block' }}>
                {JSON.stringify(data, null, 2)}
            </pre>
            <p>Visualização não implementada para este tipo de atividade.</p>
        </div>
    );
};

export default GenericActivity;
