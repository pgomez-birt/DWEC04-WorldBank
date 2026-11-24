// Controlador de la página Resumen (index.html)
// Día 1: prueba de conexión con la API. El ranking con KPIs llega el día 2.
import { obtenerPaises } from '../services/api.js';
import { mostrarCarga, mostrarError } from '../ui/estado.js';

const contenedor = document.querySelector('#resumen');

async function iniciar() {
  mostrarCarga(contenedor, 'Cargando países…');
  try {
    const paises = await obtenerPaises();
    pintarListado(paises);
  } catch (error) {
    mostrarError(contenedor, error, iniciar);
  }
}

function pintarListado(paises) {
  const lista = document.createElement('ul');
  lista.className = 'listado';
  paises
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .forEach((pais) => {
      const item = document.createElement('li');
      const enlace = document.createElement('a');
      enlace.href = `pages/detalle.html?pais=${pais.codigo}`;
      enlace.textContent = pais.nombre;
      const region = document.createElement('span');
      region.className = 'listado__meta';
      region.textContent = pais.region;
      item.append(enlace, region);
      lista.append(item);
    });

  const total = document.createElement('p');
  total.className = 'contador';
  total.textContent = `${paises.length} países cargados desde la API del Banco Mundial`;

  contenedor.replaceChildren(total, lista);
}

iniciar();
