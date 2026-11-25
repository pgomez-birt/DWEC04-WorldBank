// Composición de datos: países con el último valor de cada indicador (KPIs).
// Lo usan las páginas Resumen y Filtros.
import { INDICADORES } from '../config.js';
import { obtenerPaises, obtenerUltimoValor } from './api.js';

export async function obtenerPaisesConKpis() {
  const claves = Object.keys(INDICADORES);
  const [paises, ...valoresPorIndicador] = await Promise.all([
    obtenerPaises(),
    ...claves.map((clave) => obtenerUltimoValor(INDICADORES[clave].id)),
  ]);

  return paises.map((pais) => {
    const kpis = {};
    claves.forEach((clave, i) => {
      kpis[clave] = valoresPorIndicador[i].get(pais.codigo) ?? null;
    });
    return { ...pais, kpis };
  });
}
