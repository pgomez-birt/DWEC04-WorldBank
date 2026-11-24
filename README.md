# MundoEnCifras

Aplicación web multipágina que muestra indicadores económicos y sociales de los países del mundo (PIB per cápita, población, esperanza de vida y crecimiento del PIB) a partir de la [API del Banco Mundial](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392).

Proyecto de la **Tarea de Evaluación DWEC04** (DAW · Desarrollo Web en Entorno Cliente).

## Páginas
| Página | Ejercicio | Contenido |
|--------|-----------|-----------|
| `index.html` | 1 · Resumen | Ranking de países con KPIs |
| `pages/detalle.html` | 2 · Visualización | Gráfico interactivo de evolución |
| `pages/filtros.html` | 3 · Funcionalidad extra | Filtros por región, nivel de ingresos y nombre |

## Estructura
```
index.html
pages/          páginas secundarias
css/            estilos
js/config.js    URL base de la API e indicadores
js/services/    acceso a la API (fetch + caché en sessionStorage)
js/ui/          componentes de interfaz reutilizables (carga, errores)
js/utils/       utilidades de formato
js/pages/       un controlador por página
```

## Ejecutar en local
Usa módulos ES, así que hay que servirla por HTTP (no con doble clic):
```bash
npx serve .
```
o la extensión *Live Server* de VSCode.

## Despliegue
GitHub Pages desde la rama `main`.
