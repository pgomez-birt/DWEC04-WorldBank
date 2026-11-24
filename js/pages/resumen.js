// Controlador de la página Resumen (index.html): ranking de países con KPIs
import { INDICADORES } from '../config.js';
import { obtenerPaises, obtenerUltimoValor } from '../services/api.js';
import { mostrarCarga, mostrarError } from '../ui/estado.js';
import { formatearValor } from '../utils/formato.js';

const contenedor = document.querySelector('#resumen');
const selectIndicador = document.querySelector('#indicador');
const selectLimite = document.querySelector('#limite');

// Datos cargados una sola vez; cambiar los selectores solo vuelve a ordenar
let paises = [];

async function cargar() {
  selectIndicador.disabled = true;
  selectLimite.disabled = true;
  mostrarCarga(contenedor, 'Cargando países…');
  try {
    const [listaPaises, ...valoresPorIndicador] = await Promise.all([
      obtenerPaises(),
      ...Object.values(INDICADORES).map((ind) => obtenerUltimoValor(ind.id)),
    ]);

    // Cruza cada país con el último valor de cada indicador
    const claves = Object.keys(INDICADORES);
    paises = listaPaises.map((pais) => {
      const kpis = {};
      claves.forEach((clave, i) => {
        kpis[clave] = valoresPorIndicador[i].get(pais.codigo) ?? null;
      });
      return { ...pais, kpis };
    });

    selectIndicador.disabled = false;
    selectLimite.disabled = false;
    pintarRanking();
  } catch (error) {
    mostrarError(contenedor, error, cargar);
  }
}

function pintarRanking() {
  const clave = selectIndicador.value;
  const limite = Number(selectLimite.value);

  // Solo países con dato para el indicador elegido, de mayor a menor
  const ranking = paises
    .filter((p) => p.kpis[clave])
    .sort((a, b) => b.kpis[clave].valor - a.kpis[clave].valor)
    .slice(0, limite);

  const resumen = document.createElement('p');
  resumen.className = 'contador';
  resumen.textContent =
    `Top ${ranking.length} · ${INDICADORES[clave].nombre} · ` +
    `${paises.filter((p) => p.kpis[clave]).length} países con dato`;

  const lista = document.createElement('ol');
  lista.className = 'ranking';
  ranking.forEach((pais, posicion) => lista.append(crearFila(pais, posicion + 1, clave)));

  contenedor.replaceChildren(resumen, lista);
}

function crearFila(pais, posicion, claveOrden) {
  const item = document.createElement('li');
  item.className = 'ranking__fila';

  const cabecera = document.createElement('div');
  cabecera.className = 'ranking__cabecera';

  const pos = document.createElement('span');
  pos.className = 'ranking__pos';
  pos.textContent = posicion;

  const enlace = document.createElement('a');
  enlace.href = `pages/detalle.html?pais=${pais.codigo}`;
  enlace.className = 'ranking__nombre';
  enlace.textContent = pais.nombre;

  const region = document.createElement('span');
  region.className = 'listado__meta';
  region.textContent = pais.region;

  cabecera.append(pos, enlace, region);

  const kpis = document.createElement('dl');
  kpis.className = 'kpis';
  Object.entries(INDICADORES).forEach(([clave, ind]) => {
    const dato = pais.kpis[clave];
    const caja = document.createElement('div');
    caja.className = clave === claveOrden ? 'kpi kpi--activo' : 'kpi';
    if (dato) caja.title = `${ind.nombre} (${dato.anio})`;

    const etiqueta = document.createElement('dt');
    etiqueta.textContent = ind.nombre;
    const valor = document.createElement('dd');
    valor.textContent = dato ? formatearValor(dato.valor, ind.unidad) : '—';
    caja.append(etiqueta, valor);
    kpis.append(caja);
  });

  item.append(cabecera, kpis);
  return item;
}

selectIndicador.addEventListener('change', pintarRanking);
selectLimite.addEventListener('change', pintarRanking);

cargar();
