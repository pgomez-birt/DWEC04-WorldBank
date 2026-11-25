// Controlador de la página Filtros: búsqueda y filtros combinados sobre los países
import { INDICADORES } from '../config.js';
import { obtenerPaisesConKpis } from '../services/paises.js';
import { mostrarCarga, mostrarError } from '../ui/estado.js';
import { crearKpis } from '../ui/kpis.js';
import { normalizar, debounce } from '../utils/texto.js';

// Orden lógico de los niveles de ingresos del Banco Mundial
const ORDEN_INGRESOS = ['LIC', 'LMC', 'UMC', 'HIC', 'INX'];

const el = {
  form: document.querySelector('#form-filtros'),
  busqueda: document.querySelector('#busqueda'),
  region: document.querySelector('#region'),
  ingresos: document.querySelector('#ingresos'),
  vida: document.querySelector('#vida'),
  vidaValor: document.querySelector('#vida-valor'),
  orden: document.querySelector('#orden'),
  limpiar: document.querySelector('#limpiar'),
  contador: document.querySelector('#contador'),
  resultados: document.querySelector('#resultados'),
};
const controles = [el.busqueda, el.region, el.ingresos, el.vida, el.orden, el.limpiar];

let paises = [];

async function cargar() {
  controles.forEach((c) => (c.disabled = true));
  el.contador.textContent = '';
  mostrarCarga(el.resultados, 'Cargando países…');
  try {
    paises = await obtenerPaisesConKpis();
    rellenarOpciones();
    leerUrl();
    controles.forEach((c) => (c.disabled = false));
    aplicarFiltros();
  } catch (error) {
    mostrarError(el.resultados, error, cargar);
  }
}

// Las opciones de región e ingresos salen de los propios datos de la API
function rellenarOpciones() {
  const regiones = new Map();
  const ingresos = new Map();
  paises.forEach((p) => {
    regiones.set(p.regionId, p.region);
    ingresos.set(p.ingresosId, p.ingresos);
  });

  const opcion = (valor, texto) => {
    const o = document.createElement('option');
    o.value = valor;
    o.textContent = texto;
    return o;
  };

  [...regiones]
    .sort((a, b) => a[1].localeCompare(b[1], 'es'))
    .forEach(([id, nombre]) => el.region.append(opcion(id, nombre)));

  [...ingresos]
    .sort((a, b) => ORDEN_INGRESOS.indexOf(a[0]) - ORDEN_INGRESOS.indexOf(b[0]))
    .forEach(([id, nombre]) => el.ingresos.append(opcion(id, nombre)));
}

// ---------- Filtros en la URL (se pueden compartir y sobreviven a recargar) ----------
function leerUrl() {
  const params = new URLSearchParams(location.search);
  el.busqueda.value = params.get('q') ?? '';
  if ([...el.region.options].some((o) => o.value === params.get('region'))) el.region.value = params.get('region');
  if ([...el.ingresos.options].some((o) => o.value === params.get('ingresos'))) el.ingresos.value = params.get('ingresos');
  if ([...el.orden.options].some((o) => o.value === params.get('orden'))) el.orden.value = params.get('orden');
  const vida = Number(params.get('vida'));
  if (vida >= 0 && vida <= 85) el.vida.value = vida;
}

function guardarUrl(filtros) {
  const params = new URLSearchParams();
  if (filtros.texto) params.set('q', el.busqueda.value.trim());
  if (filtros.region) params.set('region', filtros.region);
  if (filtros.ingresos) params.set('ingresos', filtros.ingresos);
  if (filtros.vidaMinima) params.set('vida', filtros.vidaMinima);
  if (filtros.orden !== 'nombre') params.set('orden', filtros.orden);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function leerFiltros() {
  return {
    texto: normalizar(el.busqueda.value.trim()),
    region: el.region.value,
    ingresos: el.ingresos.value,
    vidaMinima: Number(el.vida.value),
    orden: el.orden.value,
  };
}

function cumpleFiltros(pais, filtros) {
  if (filtros.region && pais.regionId !== filtros.region) return false;
  if (filtros.ingresos && pais.ingresosId !== filtros.ingresos) return false;
  if (filtros.vidaMinima > 0) {
    const vida = pais.kpis.esperanzaVida?.valor;
    if (vida === undefined || vida < filtros.vidaMinima) return false;
  }
  if (filtros.texto) {
    const enNombre = normalizar(pais.nombre).includes(filtros.texto);
    const enCapital = normalizar(pais.capital ?? '').includes(filtros.texto);
    if (!enNombre && !enCapital) return false;
  }
  return true;
}

function ordenar(lista, clave) {
  if (clave === 'nombre') return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  // De mayor a menor; los países sin dato van al final
  return lista.sort((a, b) => (b.kpis[clave]?.valor ?? -Infinity) - (a.kpis[clave]?.valor ?? -Infinity));
}

function aplicarFiltros() {
  const filtros = leerFiltros();
  el.vidaValor.textContent = `${filtros.vidaMinima} años`;
  guardarUrl(filtros);

  const activos = [filtros.texto, filtros.region, filtros.ingresos, filtros.vidaMinima].filter(Boolean).length;
  el.limpiar.disabled = activos === 0 && filtros.orden === 'nombre';

  const resultado = ordenar(paises.filter((p) => cumpleFiltros(p, filtros)), filtros.orden);
  el.contador.textContent =
    `${resultado.length} de ${paises.length} países` +
    (activos ? ` · ${activos} filtro${activos > 1 ? 's' : ''} activo${activos > 1 ? 's' : ''}` : '');

  if (!resultado.length) {
    const vacio = document.createElement('div');
    vacio.className = 'estado';
    const texto = document.createElement('p');
    texto.textContent = 'Ningún país cumple los filtros seleccionados.';
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton';
    boton.textContent = 'Limpiar filtros';
    boton.addEventListener('click', limpiar);
    vacio.append(texto, boton);
    el.resultados.replaceChildren(vacio);
    return;
  }

  const lista = document.createElement('ul');
  lista.className = 'tarjetas';
  resultado.forEach((pais) => lista.append(crearTarjeta(pais, filtros)));
  el.resultados.replaceChildren(lista);
}

function crearTarjeta(pais, filtros) {
  const item = document.createElement('li');
  item.className = 'tarjeta';

  const enlace = document.createElement('a');
  enlace.className = 'tarjeta__nombre';
  enlace.href = `detalle.html?pais=${pais.codigo}` +
    (filtros.orden !== 'nombre' ? `&indicador=${filtros.orden}` : '');
  enlace.append(...resaltar(pais.nombre, filtros.texto));

  const meta = document.createElement('p');
  meta.className = 'listado__meta';
  meta.append(`${pais.region} · Capital: `, ...resaltar(pais.capital || '—', filtros.texto));

  const insignia = document.createElement('span');
  insignia.className = `insignia insignia--${pais.ingresosId.toLowerCase()}`;
  insignia.textContent = pais.ingresos;

  const claveActiva = INDICADORES[filtros.orden] ? filtros.orden : null;
  item.append(enlace, meta, insignia, crearKpis(pais, claveActiva));
  return item;
}

// Devuelve nodos de texto con la coincidencia envuelta en <mark> (sin innerHTML).
// Se compara sin tildes, así que se mapean las posiciones al texto original.
function resaltar(texto, consulta) {
  if (!consulta) return [texto];
  let normalizado = '';
  const posiciones = [];
  [...texto].forEach((caracter, i) => {
    for (const c of normalizar(caracter)) {
      normalizado += c;
      posiciones.push(i);
    }
  });
  const indice = normalizado.indexOf(consulta);
  if (indice === -1) return [texto];

  const caracteres = [...texto];
  const inicio = posiciones[indice];
  const fin = posiciones[indice + consulta.length - 1] + 1;
  const marca = document.createElement('mark');
  marca.textContent = caracteres.slice(inicio, fin).join('');
  return [caracteres.slice(0, inicio).join(''), marca, caracteres.slice(fin).join('')];
}

function limpiar() {
  el.form.reset();
  aplicarFiltros();
  el.busqueda.focus();
}

// ---------- Eventos ----------
el.busqueda.addEventListener('input', debounce(aplicarFiltros, 250));
el.region.addEventListener('change', aplicarFiltros);
el.ingresos.addEventListener('change', aplicarFiltros);
el.orden.addEventListener('change', aplicarFiltros);
el.vida.addEventListener('input', aplicarFiltros);
el.limpiar.addEventListener('click', limpiar);
// Escape vacía la búsqueda
el.busqueda.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && el.busqueda.value) {
    el.busqueda.value = '';
    aplicarFiltros();
  }
});

cargar();
