import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const JefeHeader = ({ user }) => {
    const [isWelcomeVisible, setWelcomeVisible] = useState(true);

    if (!isWelcomeVisible) {
        return null; // Don't render anything if the banner is dismissed
    }

    return (
        <div className="relative bg-pr-dark border border-pr-gray/50 rounded-lg p-6 flex items-center mb-6">
            <div className="flex items-center flex-grow"> {/* Container for logo, title, and subtitle */}
                {/* Circular Logo Placeholder */}
                <div className="w-12 h-12 rounded-full bg-pr-yellow mr-4 flex-shrink-0">
                    {/* Placeholder for the logo */}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Bienvenido de nuevo, <span className="text-pr-yellow">{user?.first_name || user?.username || 'Jefe'}</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Aquí tienes un resumen de la actividad de tu negocio.</p>
                </div>
            </div>
            <button onClick={() => setWelcomeVisible(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>
    );
};

JefeHeader.propTypes = {
    user: PropTypes.object.isRequired,
};

export default JefeHeader;
