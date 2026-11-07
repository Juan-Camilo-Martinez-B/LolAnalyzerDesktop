import {
  BarChart3,
  Download,
  Gauge,
  Keyboard,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';

/** Fixed asset name from electron-builder, so this link always points at the newest release. */
export const DOWNLOAD_URL = 'https://github.com/Juan-Camilo-Martinez-B/LolAnalyzerDesktop/releases/latest/download/LolAnalyzer-Setup.exe';
export const RELEASES_URL = 'https://github.com/Juan-Camilo-Martinez-B/LolAnalyzerDesktop/releases';

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Overlay en partida',
    text: 'KDA, CS frente a la meta de tu rol, oro, nivel y tilt encima del juego. Lo mueves con el mouse y nunca te roba el teclado.',
  },
  {
    icon: Gauge,
    title: 'Coach en vivo',
    text: 'Avisos con números reales: vuelve a base tras segundos con poca vida, objetivo en un minuto, oro sin gastar o poca visión.',
  },
  {
    icon: Trophy,
    title: 'Felicitaciones',
    text: 'Asesinatos dobles a pentakill, primera sangre, aces, torres, objetivos propios y farmeo casi perfecto, perfecto o más.',
  },
  {
    icon: Swords,
    title: 'Runas y objetos meta',
    text: 'Build de OP.GG para tu matchup de línea, con plan de línea en español. Se importa sola al fijar campeón.',
  },
  {
    icon: BarChart3,
    title: 'Análisis post-partida',
    text: 'Al terminar, tus métricas frente a la referencia del rol y tres frases claras: lo que salió bien, qué mejorar y un foco.',
  },
  {
    icon: Keyboard,
    title: 'A tu medida',
    text: 'Atajos configurables, interruptores para cada importación, Destello en D o F y sonidos que puedes apagar uno por uno.',
  },
];

const STEPS = [
  'Descarga e instala LolAnalyzer en Windows.',
  'Crea tu cuenta y vincula tu Riot ID en Ajustes.',
  'Pon League en ventana sin bordes y juega: la app hace el resto.',
];

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <a className="landing-brand" href="#inicio">
          <img src="/icon.png" alt="" width={28} height={28} />
          LolAnalyzer
        </a>
        <nav aria-label="Secciones">
          <a href="#funciones">Funciones</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a className="landing-nav__download" href={DOWNLOAD_URL}>
            <Download size={15} /> Descargar
          </a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="landing-hero">
          <p className="landing-eyebrow"><Sparkles size={14} /> Coach para League of Legends</p>
          <h1>Juega mejor cada partida, con datos de tu propio juego.</h1>
          <p className="landing-lead">
            LolAnalyzer lee tu partida en tiempo real, te avisa cuándo volver, qué objetivo viene y qué hiciste bien,
            importa la build meta de tu matchup y analiza cada partida al terminar.
          </p>
          <div className="landing-cta">
            <a className="landing-button" href={DOWNLOAD_URL}>
              <Download size={18} /> Descargar para Windows
            </a>
            <a className="landing-link" href={RELEASES_URL}>Ver todas las versiones</a>
          </div>
          <p className="landing-note">
            Windows 10 u 11 · Gratis. Al instalar, Windows puede mostrar un aviso de SmartScreen porque la app no está
            firmada: pulsa <strong>Más información</strong> y luego <strong>Ejecutar de todas formas</strong>.
          </p>
        </section>

        <section id="funciones" className="landing-section">
          <h2>Qué hace</h2>
          <div className="landing-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="landing-card">
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="landing-section">
          <h2>Cómo funciona</h2>
          <ol className="landing-steps">
            {STEPS.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="landing-trust">
            <ShieldCheck size={20} />
            <p>
              LolAnalyzer usa las APIs oficiales del cliente de League y la API de datos en vivo. No lee la memoria del
              juego ni inyecta nada en él, y nunca te pide tu contraseña de Riot.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>
          LolAnalyzer no está respaldado por Riot Games y no refleja sus opiniones ni las de nadie oficialmente
          involucrado en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades
          asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
        </p>
      </footer>
    </div>
  );
}
