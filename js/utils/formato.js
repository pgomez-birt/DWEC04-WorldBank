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

// Cambio en un periodo: puntos porcentuales si el indicador ya es un %
export function formatearCambio(resumen, unidad) {
  const cambio = unidad === '%' ? resumen.diferencia : resumen.variacion;
  if (cambio === null || cambio === undefined) return '—';
  const signo = cambio > 0 ? '+' : '';
  return `${signo}${numero.format(cambio)} ${unidad === '%' ? 'p.p.' : '%'}`;
}
