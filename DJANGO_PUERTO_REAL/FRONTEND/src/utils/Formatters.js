export const formatCurrency = (value, sign = '') => {
    const valueAsNumber = Number(value) || 0;
    const formattedValue = Math.abs(valueAsNumber).toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    let prefix = sign;
    if (valueAsNumber < 0 && sign !== '-') {
        prefix = '-';
    } else if (valueAsNumber === 0) {
        prefix = '';
    }
    return `${prefix}${formattedValue}`;
};

/**
 * Formatea un objeto Date a string 'YYYY-MM-DD'.
 */
export const toYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isToday = (someDate) => {
    if (!someDate) return false;
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
            someDate.getMonth() === today.getMonth() &&
            someDate.getFullYear() === today.getFullYear();
    };