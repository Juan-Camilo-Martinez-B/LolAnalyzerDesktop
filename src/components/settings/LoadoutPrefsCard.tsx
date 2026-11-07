import { Card } from '../ui';
import { useUserSettings } from '../../hooks/useUserSettings';
import type { FlashKey, LoadoutPreferences } from '../../services/settingsStore';
import { Switch } from './Switch';

const ROWS: { id: 'openChampSelect' | 'autoRunes' | 'autoItems' | 'autoSpells'; label: string; hint: string }[] = [
  { id: 'openChampSelect', label: 'Abrir la selección', hint: 'Cambia a la pestaña Champ Select cuando empieza la selección de campeón.' },
  { id: 'autoRunes', label: 'Runas', hint: 'Crea y activa la página "LolAnalyzer - <campeón>".' },
  { id: 'autoItems', label: 'Objetos', hint: 'Escribe el conjunto de la tienda para el campeón.' },
  { id: 'autoSpells', label: 'Hechizos de invocador', hint: 'Coloca los hechizos de la build meta.' },
];

/** Which parts of the meta build are imported by themselves when the pick is locked. */
export function LoadoutPrefsCard() {
  const { settings, update } = useUserSettings();
  const loadout = settings.loadout;

  const set = (patch: Partial<LoadoutPreferences>) => update({ loadout: patch });

  return (
    <Card
      variant="flat"
      title="Selección de campeón"
      subtitle="Qué hace la app sola durante la selección. Al fijar campeón se importa lo que esté activo; los botones manuales siguen disponibles."
    >
      {ROWS.map((row) => (
        <div key={row.id} className="settings-row">
          <div>
            <strong style={{ fontSize: '0.8rem' }}>{row.label}</strong>
            <p>{row.hint}</p>
          </div>
          <div className="loadout-pref-controls">
            {row.id === 'autoSpells' && (
              <div className="flash-key" role="radiogroup" aria-label="Tecla de Destello">
                <span>Destello en</span>
                {(['D', 'F'] as FlashKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={loadout.flashKey === key}
                    className={`flash-key__option ${loadout.flashKey === key ? 'is-active' : ''}`}
                    onClick={() => set({ flashKey: key })}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
            <Switch
              checked={loadout[row.id]}
              label={row.id === 'openChampSelect' ? row.label : `Importar ${row.label.toLowerCase()} automáticamente`}
              onClick={() => set({ [row.id]: !loadout[row.id] })}
            />
          </div>
        </div>
      ))}
    </Card>
  );
}
