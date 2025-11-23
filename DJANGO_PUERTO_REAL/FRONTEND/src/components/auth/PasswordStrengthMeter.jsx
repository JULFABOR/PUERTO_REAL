import React from 'react';
import { faCheckCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PasswordRequirement = ({ met, text }) => (
    <li className={`flex items-center transition-colors duration-300 ${met ? 'text-green-400' : 'text-gray-400'}`}>
        <FontAwesomeIcon icon={met ? faCheckCircle : faCircle} className="w-4 h-4 mr-2" />
        <span className="text-xs">{text}</span>
    </li>
);

const PasswordStrengthMeter = ({ password }) => {
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const requirements = [
        { met: isLongEnough, text: 'Al menos 8 caracteres' },
        { met: hasLowerCase, text: 'Una letra minúscula' },
        { met: hasUpperCase, text: 'Una letra mayúscula' },
        { met: hasNumber, text: 'Un número' },
        { met: hasSpecialChar, text: 'Un carácter especial (!@#...)' },
    ];

    const strengthScore = requirements.filter(r => r.met).length;

    let strength = {
        width: '0%',
        color: 'bg-gray-500',
        label: ''
    };

    if (strengthScore > 0) {
        const percentage = (strengthScore / requirements.length) * 100;
        strength.width = `${percentage}%`;

        if (strengthScore <= 2) {
            strength.color = 'bg-red-500';
            strength.label = 'Débil';
        } else if (strengthScore <= 4) {
            strength.color = 'bg-yellow-500';
            strength.label = 'Moderada';
        } else {
            strength.color = 'bg-green-500';
            strength.label = 'Fuerte';
        }
    }
    
    // Do not render the component if the password is empty
    if (!password) {
        return null;
    }

    return (
        <div className="space-y-3 p-4 bg-pr-dark-gray/50 rounded-lg mt-2">
            <div>
                <div className="h-2 w-full bg-gray-600 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                    ></div>
                </div>
                {strength.label && (
                    <p className="text-xs font-semibold text-right mt-1" style={{ color: strength.color.replace('bg-', '').replace('-500', '') }}>
                        {strength.label}
                    </p>
                )}
            </div>
            <ul className="space-y-1">
                {requirements.map((req, index) => (
                    <PasswordRequirement key={index} met={req.met} text={req.text} />
                ))}
            </ul>
        </div>
    );
};

export default PasswordStrengthMeter;
