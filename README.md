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

La apariencia predeterminada es clara, con superficies opacas. En Ajustes se elige claro, sistema u oscuro. Con sesión iniciada, esa elección se guarda en la cuenta.

## Probar sin el cliente de League

La barra **SIM**, al pie de la ventana de escritorio, solo aparece fuera de Overwolf. El overlay ya no la muestra para no tapar el juego. Desde ahí se dispara lobby, selección, partida, tiempo, CS, kill, muerte, tilt, consejo, victoria, derrota, una simulación de 40 segundos y reset.

La muerte usa la sensibilidad del coach guardada en Ajustes: 1, 2 o 3 muertes antes de la alerta.

## Electron (ventana sin bordes)

El camino de ejecución del overlay es Electron. Overwolf queda en el repositorio como ruta inactiva (`public/manifest.json`, `scripts/package-opk.mjs` y el SDK); no hace falta para desarrollar ni para jugar.

Desde `lol-analyzer-desktop`:

```bash
npm install
npm run dev:electron
```

Eso compila el proceso principal, abre Vite en `http://127.0.0.1:5173` y lanza Electron. La ventana de escritorio mide 1280×820 y no tiene marco del sistema. `npm run build:electron` solo compila `electron/` a `dist-electron/`.

El overlay es una `BrowserWindow` transparente que copia el rectángulo de `League of Legends.exe` (título habitual «League of Legends (TM) Client») y se dibuja encima. Tiene que estar en **ventana sin bordes** o en **ventana**. En `Config/game.cfg`, `[General] WindowMode` vale `2` o `1` en esos modos. Si vale `0` (pantalla completa exclusiva) el overlay no se muestra. El aviso queda en `localStorage` con la clave `lolanalyzer.overlayNotice.v1` para que la interfaz de escritorio pueda leerlo. Si el archivo no está, el overlay se muestra igual cuando la ventana del juego existe: igual conviene usar ventana sin bordes, porque en pantalla completa exclusiva Windows no deja dibujar encima.

Atajos globales, liberados al salir. Se cambian en **Ajustes → Atajos del overlay**: pulsas el atajo y luego la combinación nueva. Deben incluir Ctrl o Alt, no pueden repetirse y se rechazan las combinaciones que League ya usa (por ejemplo `Ctrl+Q`, que sube la Q de nivel). Si otro programa ocupa la combinación, se mantiene la anterior. Se guardan en `hotkeys.json` dentro de los datos de la app y se registran al abrirla. Los predeterminados son:

- `Ctrl+Shift+O` muestra u oculta el overlay.
- `Ctrl+Shift+M` alterna panel compacto y expandido.
- `Ctrl+Shift+L` desbloquea el HUD para moverlo con el mouse. Al pulsarlo otra vez se fija y el foco vuelve a League.

Fijo, el overlay deja pasar el mouse y el teclado al juego: nunca toma el foco, así que la tienda, las habilidades y el chat responden siempre. Si Windows llegara a activarlo, el foco se devuelve a la ventana del juego. En modo mover se arrastra el panel, se ajusta la opacidad y se puede volver a la esquina de Ajustes. La posición se guarda en `localStorage` (`lolanalyzer.overlayPosition.v1`) como fracción de la ventana, así sobrevive a un cambio de resolución.

El panel muestra el reloj, campeón, nivel y rol, KDA, CS con CS/min frente a una meta por rol (Top 7.5, Jungla 6, Mid 8, ADC 8.5; Soporte sin meta), el oro disponible, el estado de tilt (muertes en los últimos 3 minutos según la sensibilidad de Ajustes) y el último consejo del coach. Los datos salen del Live Client (`127.0.0.1:2999`) a través del proceso principal. El consejo lo reenvía la ventana de escritorio, que es la que tiene la sesión. Sin partida, el panel dice que espera datos y no inventa números. Si el puerto `2999` o su certificado no responden, la app arranca igual y la barra SIM del navegador (`npm run dev`) sigue sirviendo para probar sin League. Electron no lee la memoria del juego ni inyecta nada en el proceso.

## Overwolf

El manifiesto está en `public/manifest.json`. El juego objetivo es League of Legends, id `5426`. Atajos declarados:

- `Ctrl+Tab` muestra u oculta el overlay.
- `Shift+F1` alterna Mini-HUD y panel expandido.

En el navegador, `Shift+`` ` también oculta o muestra el overlay.

Detalle de flujo de datos, carga en Overwolf y zonas HUD: [docs/ui_ux_architecture.md](docs/ui_ux_architecture.md).

## Runas y objetos en la selección

Cuando eliges campeón, la vista de selección muestra **Runas y objetos** con la build meta de OP.GG. Si el rival de tu línea ya eligió, la build es para ese matchup ("Meta vs <campeón>") e incluye un consejo de línea. Si todavía no hay rival, o es una partida de práctica, se usa la build general del campeón para su línea, y la tarjeta se actualiza sola cuando aparece el rival. Las páginas recomendadas por el cliente de League quedan como alternativa, y son el respaldo si OP.GG no responde.

Al fijar el campeón se importa automáticamente, una vez por campeón y rival, lo que esté activo en **Ajustes → Importación en la selección**: runas, objetos y hechizos de invocador, cada uno con su interruptor. Junto a los hechizos eliges en qué tecla va Destello (D o F, D por defecto); los hechizos se colocan en ese orden y, si la build no lleva Destello, se respeta el orden recomendado. Los botones **Importar runas**, **Importar hechizos** e **Importar objetos** siguen disponibles aunque el automático esté apagado. El backend escribe en el cliente la página y el conjunto "LolAnalyzer - <campeón>" (Inicio, Build principal y Situacionales). Nunca borra tus páginas propias; si no queda espacio, avisa. La tarjeta solo marca "Importadas" cuando el cliente confirmó el cambio. Este escritorio no ve las credenciales del cliente.

## Preload de Electron

Las ventanas usan `sandbox: true`, y un preload con sandbox solo puede ser CommonJS. Por eso el preload vive en `electron/preload.cts` y se compila a `dist-electron/preload.cjs`. Si se compilara como módulo ES, `window.lolAnalyzer` no existiría y el overlay no recibiría datos.

## Sonidos

Los sonidos se sintetizan con Web Audio y suenan en el overlay cuando llega un consejo nuevo del coach:

| Sonido | Cuándo | Interruptor en Ajustes |
| --- | --- | --- |
| Alerta de objetivo | Dragón o Barón a punto de aparecer, o un equipo toma un objetivo | Objetivos |
| Pulso grave | Vida baja, muerte, tilt, falta de maná o un consejo crítico | Alertas de peligro |
| Campanilla suave | Consejos normales (oro sin gastar, visión) | Consejos del coach |

Ajustes tiene un botón de prueba para cada uno, y el silencio general los apaga todos. El overlay puede sonar sin que hagas clic (`autoplayPolicy`), y la ventana de escritorio no se frena en segundo plano porque es la que consulta al coach y le reenvía cada consejo al overlay.

## Análisis post-partida y plan de línea

Al salir de una partida, el escritorio pide el análisis de esa partida a `POST /api/analysis/latest`. Lo intenta a los 15, 45, 90 y 150 segundos, porque el cliente de League tarda un poco en guardar la partida en su historial. Usa el resumen final de la partida, no la telemetría en vivo, así que es una sola llamada corta a la IA por partida. Cuando llega, aparece la tarjeta **Análisis de tu última partida** con tres bloques (lo que salió bien, qué mejorar y un foco para la próxima) y las métricas frente a la referencia del rol. La tarjeta se cierra con la X.

El mismo análisis aparece en el detalle de cada partida del dashboard. Las partidas antiguas muestran **Analizar esta partida**, así solo se gastan tokens en las que abres. Cada análisis se guarda y no se vuelve a generar.

En la selección, cuando se conoce al rival de línea, la tarjeta de runas y objetos muestra un **Plan de línea**: en línea, cuándo pelear y qué evitar. Se arma con los datos del matchup de OP.GG y se genera una sola vez por matchup. Sin Groq, se usan textos generados con reglas.
