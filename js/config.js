// Configuración global de la aplicación
export const API_BASE = 'https://api.worldbank.org/v2/es';

// Indicadores del Banco Mundial que usa la aplicación
export const INDICADORES = {
  pibPerCapita: { id: 'NY.GDP.PCAP.CD', nombre: 'PIB per cápita', unidad: 'US$' },
  poblacion: { id: 'SP.POP.TOTL', nombre: 'Población', unidad: 'hab.' },
  esperanzaVida: { id: 'SP.DYN.LE00.IN', nombre: 'Esperanza de vida', unidad: 'años' },
  crecimientoPib: { id: 'NY.GDP.MKTP.KD.ZG', nombre: 'Crecimiento del PIB', unidad: '%' },
};

// Tiempo de vida de la caché en sessionStorage (ms)
export const CACHE_TTL = 60 * 60 * 1000;
