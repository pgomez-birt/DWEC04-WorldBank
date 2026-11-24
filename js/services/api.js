// Capa de acceso a datos: todas las peticiones HTTP a la API del Banco Mundial
import { API_BASE, CACHE_TTL } from '../config.js';

// Lee de sessionStorage si la respuesta sigue vigente
function leerCache(clave) {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(clave));
    if (guardado && Date.now() - guardado.fecha < CACHE_TTL) return guardado.datos;
  } catch {
    // Caché corrupta o no disponible: se ignora
  }
  return null;
}

function guardarCache(clave, datos) {
  try {
    sessionStorage.setItem(clave, JSON.stringify({ fecha: Date.now(), datos }));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app funciona igual
  }
}

// Petición genérica. La API devuelve [metadatos, datos]; devuelve el par completo
async function peticionCompleta(ruta) {
  const url = `${API_BASE}${ruta}${ruta.includes('?') ? '&' : '?'}format=json`;
  const cache = leerCache(url);
  if (cache) return cache;

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status} al consultar la API`);
  }
  const json = await respuesta.json();
  // Cuando hay un error, la API responde 200 con un objeto "message"
  if (!Array.isArray(json) || json[0]?.message) {
    throw new Error('La API devolvió una respuesta no válida');
  }
  guardarCache(url, json);
  return json;
}

// Solo los datos de una petición
async function peticion(ruta) {
  const [, datos] = await peticionCompleta(ruta);
  return datos ?? [];
}

// Países reales (se excluyen agregados como "Mundo" o "Zona euro")
export async function obtenerPaises() {
  const datos = await peticion('/country?per_page=400');
  return datos
    .filter((p) => p.region.id !== 'NA')
    .map((p) => ({
      codigo: p.id,
      nombre: p.name,
      region: p.region.value.trim(),
      regionId: p.region.id,
      ingresos: p.incomeLevel.value,
      ingresosId: p.incomeLevel.id,
      capital: p.capitalCity,
    }));
}

// Último valor disponible de un indicador para todos los países.
// La API no admite "mrnev" en esta consulta, así que se pide un rango de años
// y se conserva el año más reciente con dato no nulo de cada país.
// Se pide por páginas de 400: con páginas mayores la API no envía la cabecera CORS.
export async function obtenerUltimoValor(indicadorId) {
  const base = `/country/all/indicator/${indicadorId}?date=2015:2025&per_page=400`;
  const [meta, primera] = await peticionCompleta(base + '&page=1');
  const resto = await Promise.all(
    Array.from({ length: (meta.pages ?? 1) - 1 }, (_, i) =>
      peticion(`${base}&page=${i + 2}`)
    )
  );
  const datos = [primera ?? [], ...resto].flat();
  const valores = new Map();
  datos.forEach((d) => {
    if (d.value === null) return;
    const anio = Number(d.date);
    const actual = valores.get(d.countryiso3code);
    if (!actual || anio > actual.anio) valores.set(d.countryiso3code, { valor: d.value, anio });
  });
  return valores;
}

// Serie temporal de un indicador para un país
export async function obtenerSerie(codigoPais, indicadorId, desde, hasta) {
  const datos = await peticion(
    `/country/${codigoPais}/indicator/${indicadorId}?date=${desde}:${hasta}&per_page=100`
  );
  return datos
    .filter((d) => d.value !== null)
    .map((d) => ({ anio: Number(d.date), valor: d.value }))
    .sort((a, b) => a.anio - b.anio);
}
