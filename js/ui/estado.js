// Componentes de interfaz reutilizables: carga y errores
export function mostrarCarga(contenedor, texto = 'Cargando datos…') {
  contenedor.innerHTML = `
    <div class="estado estado--carga" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <p>${texto}</p>
    </div>`;
}

export function mostrarError(contenedor, error, alReintentar) {
  contenedor.innerHTML = `
    <div class="estado estado--error" role="alert">
      <p>No se han podido cargar los datos.</p>
      <p class="estado__detalle"></p>
      <button type="button" class="boton">Reintentar</button>
    </div>`;
  // textContent evita inyectar HTML desde el mensaje de error
  contenedor.querySelector('.estado__detalle').textContent = error.message;
  contenedor.querySelector('button').addEventListener('click', alReintentar);
}
