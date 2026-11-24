// Utilidades de formato de números
const numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const compacto = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

export function formatearValor(valor, unidad) {
  if (valor === null || valor === undefined) return '—';
  switch (unidad) {
    case 'US$':
      return `${compacto.format(valor)} US$`;
    case 'hab.':
      return compacto.format(valor);
    case '%':
      return `${numero.format(valor)} %`;
    case 'años':
      return `${numero.format(valor)} años`;
    default:
      return numero.format(valor);
  }
}
