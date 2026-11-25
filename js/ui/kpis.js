// Componente reutilizable: bloque con los KPIs de un país
import { INDICADORES } from '../config.js';
import { formatearValor } from '../utils/formato.js';

export function crearKpis(pais, claveActiva = null) {
  const kpis = document.createElement('dl');
  kpis.className = 'kpis';
  Object.entries(INDICADORES).forEach(([clave, ind]) => {
    const dato = pais.kpis[clave];
    const caja = document.createElement('div');
    caja.className = clave === claveActiva ? 'kpi kpi--activo' : 'kpi';

    const etiqueta = document.createElement('dt');
    etiqueta.textContent = ind.nombre;
    const valor = document.createElement('dd');
    valor.textContent = dato ? formatearValor(dato.valor, ind.unidad) : '—';
    caja.append(etiqueta, valor);

    // Año del dato visible: cada indicador tiene su último año publicado
    if (dato) {
      const anio = document.createElement('span');
      anio.className = 'kpi__anio';
      anio.textContent = dato.anio;
      caja.append(anio);
    }
    kpis.append(caja);
  });
  return kpis;
}
