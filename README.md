# LolAnalyzer Desktop

Cliente de escritorio y overlay para League of Legends. Muestra métricas, asistente de selección de campeón y un HUD de coach en partida. Está hecho con React 19, TypeScript y Vite, y se empaqueta como app de Overwolf.

## Ventanas

| Ventana | HTML | Rol |
|---|---|---|
| Desktop | `index.html` | Dashboard, selección, coach y ajustes |
| Overlay | `overlay.html` | Mini-HUD y panel en partida |
| Background | `background.html` | Eventos de juego, sonda LCU y visibilidad de ventanas |

En el navegador cada HTML es una página aparte. No comparten memoria: el estado viaja por el `eventBus` dentro de la misma página y, entre páginas, por `localStorage` (ajustes) o por mensajes de Overwolf.

## Desarrollo

```bash
npm install
npm run dev
```

Vite abre el escritorio en `http://localhost:5173/`. El overlay está en `http://localhost:5173/overlay.html`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `tsc -b` y bundles de las tres páginas en `dist/` |
| `npm run lint` | Oxlint |
| `npm test` | Pruebas de assets, tilt y estado |
| `npm run preview` | Sirve el build |
| `npm run package:opk` | Build y `release/LolAnalyzer.opk` para cargar en Overwolf |

El backend esperado es `http://localhost:8000` (`VITE_API_BASE_URL` lo cambia). El acceso pide cuenta local: registro, inicio de sesión y recuperación con tres preguntas. El token de acceso queda en memoria; el de refresco se cifra en el navegador. La cuenta de Riot se vincula en Ajustes con el Riot ID. La clave de Riot no sale del servidor. Sin sesión, el dashboard de demostración sigue disponible. Con sesión, las partidas vacías piden vincular la cuenta en lugar de mostrar datos ficticios.

## Probar sin el cliente de League

La barra **SIM**, al pie del escritorio y del overlay, solo aparece fuera de Overwolf. Desde ahí se dispara lobby, selección, partida, tiempo, CS, kill, muerte, tilt, consejo, victoria, derrota, una simulación de 40 segundos y reset.

La muerte usa la sensibilidad del coach guardada en Ajustes: 1, 2 o 3 muertes antes de la alerta.

## Overwolf

El manifiesto está en `public/manifest.json`. El juego objetivo es League of Legends, id `5426`. Atajos declarados:

- `Ctrl+Tab` muestra u oculta el overlay.
- `Shift+F1` alterna Mini-HUD y panel expandido.

En el navegador, `Shift+`` ` también oculta o muestra el overlay.

Detalle de flujo de datos, carga en Overwolf y zonas HUD: [docs/ui_ux_architecture.md](docs/ui_ux_architecture.md).
