// Controlador de la página Detalle: gráfico interactivo y tabla comparativa
import { INDICADORES } from '../config.js';
import { obtenerPaises, obtenerSerie } from '../services/api.js';
import { mostrarCarga, mostrarError } from '../ui/estado.js';
import { formatearValor, formatearCambio } from '../utils/formato.js';
import { resumirSerie } from '../utils/estadisticas.js';

const ANIO_MIN = 1990;
const ANIO_MAX = 2025;
const MAX_COMPARAR = 3;
const COLORES = ['#0b6e99', '#d9480f', '#2b8a3e', '#7048e8'];

const el = {
  ficha: document.querySelector('#ficha'),
  pais: document.querySelector('#pais'),
  indicador: document.querySelector('#indicador'),
  desde: document.querySelector('#desde'),
  hasta: document.querySelector('#hasta'),
  comparar: document.querySelector('#comparar'),
  anadir: document.querySelector('#anadir'),
  chips: document.querySelector('#chips'),
  estadoGrafico: document.querySelector('#estado-grafico'),
  canvas: document.querySelector('#grafico'),
  tabla: document.querySelector('#tabla'),
};

// Estado de la vista; se refleja en la URL para poder compartirla
const estado = {
  pais: 'ESP',
  comparar: [],
  indicador: 'pibPerCapita',
  desde: 2000,
  hasta: ANIO_MAX,
  orden: { columna: 'ultimo', descendente: true },
};

let paisesPorCodigo = new Map();
let grafico = null;
let filasTabla = [];
let peticionActual = 0; // descarta respuestas que llegan tarde

const indicadorActual = () => INDICADORES[estado.indicador];
const nombrePais = (codigo) => paisesPorCodigo.get(codigo)?.nombre ?? codigo;

// ---------- URL ----------
function leerUrl() {
  const params = new URLSearchParams(location.search);
  const pais = (params.get('pais') ?? 'ESP').toUpperCase();
  estado.pais = paisesPorCodigo.has(pais) ? pais : 'ESP';
  estado.comparar = (params.get('comparar') ?? '')
    .split(',')
    .map((c) => c.toUpperCase())
    .filter((c) => paisesPorCodigo.has(c) && c !== estado.pais)
    .slice(0, MAX_COMPARAR);
  if (INDICADORES[params.get('indicador')]) estado.indicador = params.get('indicador');
  const desde = Number(params.get('desde'));
  const hasta = Number(params.get('hasta'));
  if (desde >= ANIO_MIN && desde <= ANIO_MAX) estado.desde = desde;
  if (hasta >= ANIO_MIN && hasta <= ANIO_MAX) estado.hasta = hasta;
  if (estado.desde > estado.hasta) [estado.desde, estado.hasta] = [estado.hasta, estado.desde];
  return paisesPorCodigo.has(pais);
}

function guardarUrl() {
  const params = new URLSearchParams({
    pais: estado.pais,
    indicador: estado.indicador,
    desde: estado.desde,
    hasta: estado.hasta,
  });
  if (estado.comparar.length) params.set('comparar', estado.comparar.join(','));
  history.replaceState(null, '', `?${params}`);
}

// ---------- Inicio ----------
async function iniciar() {
  mostrarCarga(el.ficha, 'Cargando países…');
  try {
    const paises = await obtenerPaises();
    paises.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    paisesPorCodigo = new Map(paises.map((p) => [p.codigo, p]));
    const encontrado = leerUrl();
    rellenarSelects(paises);
    [el.pais, el.indicador, el.desde, el.hasta, el.comparar].forEach((s) => (s.disabled = false));
    actualizar(encontrado ? null : 'El país indicado no existe; se muestra España.');
  } catch (error) {
    mostrarError(el.ficha, error, iniciar);
  }
}

function crearOpcion(valor, texto) {
  const opcion = document.createElement('option');
  opcion.value = valor;
  opcion.textContent = texto;
  return opcion;
}

function rellenarSelects(paises) {
  el.pais.replaceChildren(...paises.map((p) => crearOpcion(p.codigo, p.nombre)));
  el.comparar.replaceChildren(
    crearOpcion('', 'Elige un país'),
    ...paises.map((p) => crearOpcion(p.codigo, p.nombre))
  );
  const anios = [];
  for (let anio = ANIO_MIN; anio <= ANIO_MAX; anio++) anios.push(anio);
  el.desde.replaceChildren(...anios.map((a) => crearOpcion(a, a)));
  el.hasta.replaceChildren(...anios.map((a) => crearOpcion(a, a)));
  sincronizarControles();
}

function sincronizarControles() {
  el.pais.value = estado.pais;
  el.indicador.value = estado.indicador;
  el.desde.value = estado.desde;
  el.hasta.value = estado.hasta;
  // No se puede comparar un país consigo mismo ni repetirlo
  const enUso = new Set([estado.pais, ...estado.comparar]);
  [...el.comparar.options].forEach((o) => (o.disabled = o.value !== '' && enUso.has(o.value)));
  if (enUso.has(el.comparar.value)) el.comparar.value = '';
  const lleno = estado.comparar.length >= MAX_COMPARAR;
  el.comparar.disabled = lleno;
  el.anadir.disabled = lleno || el.comparar.value === '';
  el.anadir.textContent = lleno ? `Máximo ${MAX_COMPARAR}` : 'Añadir';
}

// ---------- Pintado ----------
function pintarFicha(aviso) {
  const pais = paisesPorCodigo.get(estado.pais);
  const titulo = document.createElement('h2');
  titulo.textContent = pais.nombre;

  const datos = document.createElement('dl');
  datos.className = 'ficha__datos';
  [
    ['Región', pais.region],
    ['Nivel de ingresos', pais.ingresos],
    ['Capital', pais.capital || '—'],
  ].forEach(([etiqueta, valor]) => {
    const caja = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = etiqueta;
    const dd = document.createElement('dd');
    dd.textContent = valor;
    caja.append(dt, dd);
    datos.append(caja);
  });

  el.ficha.replaceChildren(titulo, datos);
  if (aviso) {
    const p = document.createElement('p');
    p.className = 'aviso';
    p.textContent = aviso;
    el.ficha.append(p);
  }
}

function pintarChips() {
  const codigos = [estado.pais, ...estado.comparar];
  el.chips.replaceChildren(
    ...codigos.map((codigo, i) => {
      const chip = document.createElement('li');
      chip.className = 'chip';
      const color = document.createElement('span');
      color.className = 'chip__color';
      color.style.background = COLORES[i];
      const texto = document.createElement('span');
      texto.textContent = nombrePais(codigo);
      chip.append(color, texto);
      if (i > 0) {
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'chip__quitar';
        quitar.dataset.codigo = codigo;
        quitar.setAttribute('aria-label', `Quitar ${nombrePais(codigo)} de la comparación`);
        quitar.textContent = '×';
        chip.append(quitar);
      }
      return chip;
    })
  );
}

async function actualizar(aviso = null) {
  guardarUrl();
  sincronizarControles();
  pintarFicha(aviso);
  pintarChips();

  const id = ++peticionActual;
  const codigos = [estado.pais, ...estado.comparar];
  mostrarCarga(el.estadoGrafico, 'Cargando series…');
  try {
    const series = await Promise.all(
      codigos.map((c) => obtenerSerie(c, indicadorActual().id, estado.desde, estado.hasta))
    );
    if (id !== peticionActual) return; // el usuario ya cambió algo
    el.estadoGrafico.replaceChildren();
    if (series.every((s) => s.length === 0)) {
      const vacio = document.createElement('p');
      vacio.className = 'aviso';
      vacio.textContent = 'No hay datos de este indicador en el rango de años elegido.';
      el.estadoGrafico.append(vacio);
    }
    pintarGrafico(codigos, series);
    prepararTabla(codigos, series);
  } catch (error) {
    if (id !== peticionActual) return;
    mostrarError(el.estadoGrafico, error, () => actualizar());
  }
}

function pintarGrafico(codigos, series) {
  if (typeof Chart === 'undefined') {
    throw new Error('No se pudo cargar la librería de gráficos (Chart.js).');
  }
  const anios = [];
  for (let a = estado.desde; a <= estado.hasta; a++) anios.push(a);

  const datasets = codigos.map((codigo, i) => {
    const valores = new Map(series[i].map((p) => [p.anio, p.valor]));
    return {
      label: nombrePais(codigo),
      data: anios.map((a) => valores.get(a) ?? null),
      borderColor: COLORES[i],
      backgroundColor: `${COLORES[i]}22`,
      fill: codigos.length === 1,
      tension: 0.25,
      spanGaps: true,
      pointRadius: 2,
      pointHoverRadius: 6,
    };
  });

  if (grafico) {
    grafico.data.labels = anios;
    grafico.data.datasets = datasets;
    grafico.options.scales.y.title.text = tituloEjeY();
    grafico.update();
    return;
  }

  grafico = new Chart(el.canvas, {
    type: 'line',
    data: { labels: anios, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            // Valor exacto y formateado en el tooltip
            label: (ctx) =>
              `${ctx.dataset.label}: ${formatearValor(ctx.parsed.y, indicadorActual().unidad)}`,
          },
        },
      },
      scales: {
        y: {
          title: { display: true, text: tituloEjeY() },
          ticks: { callback: (valor) => formatearValor(valor, indicadorActual().unidad) },
        },
      },
    },
  });
}

const tituloEjeY = () => `${indicadorActual().nombre} (${indicadorActual().unidad})`;

// ---------- Tabla comparativa ordenable ----------
const COLUMNAS = [
  { clave: 'nombre', titulo: 'País' },
  { clave: 'primero', titulo: 'Primer dato' },
  { clave: 'ultimo', titulo: 'Último dato' },
  { clave: 'cambio', titulo: 'Cambio' },
  { clave: 'maximo', titulo: 'Máximo' },
  { clave: 'media', titulo: 'Media' },
];

function prepararTabla(codigos, series) {
  filasTabla = codigos.map((codigo, i) => ({
    nombre: nombrePais(codigo),
    color: COLORES[i],
    ...resumirSerie(series[i]),
  }));
  pintarTabla();
}

// Valor numérico (o texto) por el que se ordena cada columna
function valorOrden(fila, clave) {
  switch (clave) {
    case 'nombre': return fila.nombre;
    case 'cambio': return indicadorActual().unidad === '%' ? fila.diferencia : fila.variacion;
    case 'media': return fila.media;
    default: return fila[clave]?.valor ?? null;
  }
}

function pintarTabla() {
  const { columna, descendente } = estado.orden;
  const filas = [...filasTabla].sort((a, b) => {
    const va = valorOrden(a, columna);
    const vb = valorOrden(b, columna);
    if (va === null) return 1; // sin dato siempre al final
    if (vb === null) return -1;
    const comparacion = typeof va === 'string' ? va.localeCompare(vb, 'es') : va - vb;
    return descendente ? -comparacion : comparacion;
  });

  const unidad = indicadorActual().unidad;
  const conAnio = (punto) => (punto ? `${formatearValor(punto.valor, unidad)} (${punto.anio})` : '—');

  const thead = document.createElement('thead');
  const filaCabecera = document.createElement('tr');
  COLUMNAS.forEach(({ clave, titulo }) => {
    const th = document.createElement('th');
    th.scope = 'col';
    if (clave === columna) th.setAttribute('aria-sort', descendente ? 'descending' : 'ascending');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.dataset.columna = clave;
    boton.textContent = titulo + (clave === columna ? (descendente ? ' ▼' : ' ▲') : '');
    th.append(boton);
    filaCabecera.append(th);
  });
  thead.append(filaCabecera);

  const tbody = document.createElement('tbody');
  filas.forEach((fila) => {
    const tr = document.createElement('tr');
    const celdas = [
      fila.nombre,
      conAnio(fila.primero),
      conAnio(fila.ultimo),
      formatearCambio(fila, unidad),
      conAnio(fila.maximo),
      fila.media === null ? '—' : formatearValor(fila.media, unidad),
    ];
    celdas.forEach((texto, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) {
        td.scope = 'row';
        const color = document.createElement('span');
        color.className = 'chip__color';
        color.style.background = fila.color;
        td.append(color, ' ');
      }
      td.append(texto);
      tr.append(td);
    });
    tbody.append(tr);
  });

  el.tabla.replaceChildren(thead, tbody);
}

// ---------- Eventos ----------
el.pais.addEventListener('change', () => {
  estado.pais = el.pais.value;
  estado.comparar = estado.comparar.filter((c) => c !== estado.pais);
  actualizar();
});

el.indicador.addEventListener('change', () => {
  estado.indicador = el.indicador.value;
  actualizar();
});

el.desde.addEventListener('change', () => {
  estado.desde = Number(el.desde.value);
  if (estado.desde > estado.hasta) estado.hasta = estado.desde;
  actualizar();
});

el.hasta.addEventListener('change', () => {
  estado.hasta = Number(el.hasta.value);
  if (estado.hasta < estado.desde) estado.desde = estado.hasta;
  actualizar();
});

el.comparar.addEventListener('change', () => {
  el.anadir.disabled = el.comparar.value === '' || estado.comparar.length >= MAX_COMPARAR;
});

el.anadir.addEventListener('click', () => {
  const codigo = el.comparar.value;
  if (!codigo || estado.comparar.length >= MAX_COMPARAR) return;
  estado.comparar.push(codigo);
  el.comparar.value = '';
  actualizar();
});

// Delegación de eventos: un único listener para todos los botones de quitar
el.chips.addEventListener('click', (evento) => {
  const boton = evento.target.closest('.chip__quitar');
  if (!boton) return;
  estado.comparar = estado.comparar.filter((c) => c !== boton.dataset.codigo);
  actualizar();
});

el.tabla.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-columna]');
  if (!boton) return;
  const clave = boton.dataset.columna;
  estado.orden = {
    columna: clave,
    descendente: estado.orden.columna === clave ? !estado.orden.descendente : clave !== 'nombre',
  };
  pintarTabla();
});

iniciar();
