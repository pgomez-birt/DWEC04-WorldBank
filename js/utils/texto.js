// Utilidades de texto y eventos

// Minúsculas y sin tildes: "Perú" y "peru" coinciden
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Retrasa la ejecución hasta que el usuario deja de escribir
export function debounce(funcion, espera) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...args), espera);
  };
}
