
export const formatCurrencyInput = (value: string | number): string => {
    if (value === '' || value === undefined || value === null) return '';

    // Convert to string and remove existing non-digits to be safe
    const stringValue = value.toString().replace(/\D/g, '');

    if (stringValue === '') return '';

    // Format with dots
    return new Intl.NumberFormat('id-ID').format(Number(stringValue));
};

export const parseCurrencyInput = (value: string): string => {
    // Remove all non-digits
    return value.replace(/\./g, '').replace(/,/g, '');
};
