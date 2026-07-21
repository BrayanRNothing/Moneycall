import { getUser } from './authUtils';

export const applyTemplate = (text, contacto) => {
    const user = getUser();
    const replacements = {
        '{{nombre}}': String(contacto?.nombres || '').trim(),
        '{{empresa}}': String(contacto?.empresa || '').trim(),
        '{{telefono}}': String(contacto?.telefono || '').trim(),
        '{{correo}}': String(contacto?.correo || '').trim(),
        '{{etapa}}': String(contacto?.etapaEmbudo || '').trim(),
        '{{vendedor}}': String(user?.nombre || '').trim(),
        '{{fecha_hoy}}': new Date().toLocaleDateString('es-MX')
    };

    return Object.entries(replacements).reduce((acc, [k, v]) => acc.split(k).join(v), text || '');
};
