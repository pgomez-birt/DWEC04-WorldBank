// Cálculos sobre una serie temporal [{ anio, valor }] ordenada por año
export function resumirSerie(serie) {
  if (!serie.length) {
    return { primero: null, ultimo: null, maximo: null, media: null, variacion: null, diferencia: null };
  }
  const primero = serie[0];
  const ultimo = serie[serie.length - 1];
  const maximo = serie.reduce((max, punto) => (punto.valor > max.valor ? punto : max));
  const media = serie.reduce((suma, punto) => suma + punto.valor, 0) / serie.length;
  const diferencia = ultimo.valor - primero.valor;
  // Variación porcentual; no tiene sentido si el valor inicial es 0
  const variacion = primero.valor !== 0 ? (diferencia / Math.abs(primero.valor)) * 100 : null;
  return { primero, ultimo, maximo, media, variacion, diferencia };
}
