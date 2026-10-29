# Línea base de la migración (fase 0)

Fecha: 29 de octubre de 2026. Estado de los repositorios antes de cualquier cambio de la migración, para detectar regresiones en las fases siguientes.

## Resultados automáticos

| Repositorio | Comando | Resultado |
|---|---|---|
| desktop | `npm test` | 31 pruebas, 6 archivos, todo en verde |
| desktop | `npm run lint` | Sin errores. 8 advertencias previas (imports sin usar, `set-state-in-effect`, `exhaustive-deps`) |
| desktop | `npm run build` | Correcto: tres bundles (desktop, overlay, background) |
| backend | `pytest` (antes de la fase 0) | 18 fallos, 29 en verde |
| backend | `pytest` (después de la fase 0) | 51 en verde (47 previas + 4 del anonimizador) |

## Problemas encontrados y corregidos en la fase 0

1. **Las pruebas usaban la base de datos real.** `tests/conftest.py` no aislaba la BD y `pytest` se conectaba al Supabase de `.env`. Ahora las pruebas usan `test_lol_analyzer.db` (SQLite, ignorado por git) y se recrea en cada ejecución. También desactiva la autoconexión al LCU.
2. **Comparación de fechas con SQLite.** `auth_guard.py` comparaba fechas sin zona horaria (SQLite) con fechas con zona horaria. Se normalizan a UTC antes de comparar. En PostgreSQL el comportamiento no cambia.

## Problemas encontrados y pendientes

| Problema | Impacto | Cuándo se atiende |
|---|---|---|
| Supabase responde `tenant/user ... not found` con el `DATABASE_URL` de `.env` | El backend no puede usar la BD en la nube; bloquea el despliegue | Antes de la fase 7: revisar en el panel de Supabase si el proyecto está pausado o si cambió la cadena de conexión |
| `apiClient.ts` llama a rutas `/api/v1/...` que no existen en el backend (`/analytics/{puuid}/kpi`, `/matches/{puuid}`, `/coach/{puuid}/analytics`, `/champ-select/recommend`, `/telemetry/sync`, `/auth/lcu-login`) | Hoy ninguno: solo se ejecutan si `state.summoner` tiene valor, y eso no ocurre. El dashboard real usa `/api/riot/*` | Fase 6: el agente de Electron **no** debe llenar `state.summoner` sin antes migrar o retirar esas llamadas |
| `/champ-select/recommend` no existe en el backend | `fetchChampionRecommendations` no se usa en ningún componente | Sin acción en esta migración |

## Fixtures de partidas reales

Hay un script que captura y anonimiza los datos. Se ejecuta con el juego o el cliente abiertos, desde `lol-analyzer-backend`:

```bash
# Durante una partida (por ejemplo en Practice Tool), en dos o tres momentos distintos
python -m scripts.capture_live_fixtures live practice_tool_early
python -m scripts.capture_live_fixtures live practice_tool_after_death

# En la selección de campeón de una personalizada o contra bots
python -m scripts.capture_live_fixtures champ-select custom_vs_bots
```

Los archivos quedan en `tests/fixtures/live_client/` y `tests/fixtures/champ_select/`. Cada jugador se reemplaza por `Player1`, `Player2`..., de forma consistente entre la lista de jugadores y los eventos de kills. Los Riot ID, tags, `puuid` y `summonerId` no se guardan. **Revisa cada archivo antes del commit.**

## Revisión manual pendiente (navegador + SIM)

Con `uvicorn` y `npx vite` corriendo (ver `correr.md`), recorrer y anotar el estado de cada punto:

- [ ] Registro, inicio de sesión y recuperación con preguntas
- [ ] Vincular cuenta por Riot ID
- [ ] Dashboard: KPI, tabla de campeones, historial y modal de telemetría
- [ ] Tilt-o-Meter y analítica del coach
- [ ] Tema claro, oscuro y sistema
- [ ] Champ select con SIM: draft, counters, bans
- [ ] Overlay (`/overlay.html`): Mini-HUD, panel, opacidad, ancla y teclas
- [ ] Alerta de tilt según la sensibilidad (1, 2 o 3 muertes)
- [ ] Audio de alertas
