import React from 'react';

// --- Componente de Input Reutilizable con Etiqueta Flotante ---
const FormInput = ({ name, label, value, onChange, error, type = 'text', required = false, step = undefined, min = undefined, id }) => (
    <div className="relative z-0 w-full">
        <input
            type={type} 
            name={name} 
            // Usa el 'id' proporcionado, o genera uno a partir del 'name'
            id={id || `form_input_${name}`} 
            value={value} 
            onChange={onChange}
            required={required} 
            step={step} 
            min={min} 
            autoComplete="off"
            className={`
                block w-full p-2.5 pt-6 text-sm text-white bg-pr-dark-gray border 
                rounded-lg appearance-none focus:outline-none focus:ring-0
                ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-500 focus:border-pr-yellow'}
                peer
            `}
            placeholder=" " 
        />
        <label
            htmlFor={id || `form_input_${name}`}
            className={`
                absolute text-sm duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0]
                left-2.5 
                ${error ? 'text-red-400' : 'text-gray-400'}
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                peer-focus:scale-75 peer-focus:-translate-y-4
                ${error ? 'peer-focus:text-red-400' : 'peer-focus:text-pr-yellow'}
            `}
        >
            {label}{required && ' *'}
        </label>
        {error && <p className="mt-1 text-xs text-red-400">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
);

export default FormInput;