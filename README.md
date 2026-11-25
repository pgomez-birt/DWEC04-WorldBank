# MundoEnCifras

Aplicación web multipágina que muestra indicadores económicos y sociales de los países del mundo (PIB per cápita, población, esperanza de vida y crecimiento del PIB) a partir de la [API del Banco Mundial](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392).

Proyecto de la **Tarea de Evaluación DWEC04** (DAW · Desarrollo Web en Entorno Cliente).

## Páginas
| Página | Ejercicio | Contenido |
|--------|-----------|-----------|
| `index.html` | 1 · Resumen | Ranking de países con KPIs, ordenable por indicador |
| `pages/detalle.html` | 2 · Visualización | Gráfico interactivo (Chart.js) con comparación de hasta 4 países y tabla ordenable |
| `pages/filtros.html` | 3 · Funcionalidad extra | Búsqueda por nombre/capital y filtros por región, nivel de ingresos y esperanza de vida |

Las tres páginas muestran un indicador de carga mientras consultan la API y un mensaje de error con botón de reintento si la consulta falla.

## Estructura
```
index.html
pages/                  páginas secundarias (detalle, filtros)
css/styles.css          estilos (variables CSS, diseño adaptable a móvil)
js/config.js            URL base de la API e indicadores
js/services/api.js      acceso a la API: fetch, paginación y caché en sessionStorage
js/services/paises.js   composición de datos: países + KPIs
js/ui/                  componentes reutilizables (carga/errores, bloque de KPIs)
js/utils/               formato de números, estadísticas, texto y debounce
js/pages/               un controlador por página (eventos y pintado)
```

## Ejecutar en local
Usa módulos ES, así que hay que servirla por HTTP (no con doble clic):
```bash
npx serve .
```
o la extensión *Live Server* de VSCode.

## Despliegue
GitHub Pages desde la rama `main`.
