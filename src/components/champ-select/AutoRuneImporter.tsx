import React, { useEffect, useState } from 'react';
import { Check, Package, Zap } from 'lucide-react';
import { Badge, Card, Spinner } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import { audioService } from '../../services/audioService';
import {
  RUNE_STYLE_NAMES,
  fetchLoadout,
  importItems,
  importRunes,
  runeIconUrl,
  type Loadout,
} from '../../services/loadoutClient';
import { messageFromUnknown } from '../../services/userErrors';
import './champSelect.css';

export interface AutoRuneImporterProps {
  championId: number;
  championName: string;
  position?: string;
}

type ImportState = { status: 'idle' | 'working' | 'done' | 'error'; message?: string };

const IDLE: ImportState = { status: 'idle' };

/**
 * Runes from the client's recommendations and items from the player's own games.
 * The badge only says "importado" after the client confirmed the write.
 */
export const AutoRuneImporter: React.FC<AutoRuneImporterProps> = ({ championId, championName, position }) => {
  const [loadout, setLoadout] = useState<Loadout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [runeState, setRuneState] = useState<ImportState>(IDLE);
  const [itemState, setItemState] = useState<ImportState>(IDLE);

  useEffect(() => {
    // The parent remounts this card (key) when the champion or lane changes.
    let cancelled = false;
    fetchLoadout(championId, championName, position)
      .then((body) => {
        if (!cancelled) setLoadout(body);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(messageFromUnknown(error));
      });
    return () => {
      cancelled = true;
    };
  }, [championId, championName, position]);

  const page = loadout?.runePages[pageIndex] ?? null;
  const build = loadout?.build;

  const applyRunes = async () => {
    if (!page) return;
    audioService.playClick();
    setRuneState({ status: 'working' });
    try {
      const result = await importRunes(championName, page);
      setRuneState({
        status: 'done',
        message: result.spellsApplied ? 'Runas y hechizos aplicados.' : 'Runas aplicadas.',
      });
      audioService.playSuccess();
    } catch (error) {
      setRuneState({ status: 'error', message: messageFromUnknown(error) });
    }
  };

  const applyItems = async () => {
    if (!build || build.itemIds.length === 0) return;
    audioService.playClick();
    setItemState({ status: 'working' });
    try {
      await importItems(championId, championName, build.itemIds, build.games);
      setItemState({ status: 'done', message: 'Conjunto creado en la tienda del cliente.' });
      audioService.playSuccess();
    } catch (error) {
      setItemState({ status: 'error', message: messageFromUnknown(error) });
    }
  };

  return (
    <Card variant="cyan" className="card--fit loadout">
      <div className="cs-head">
        <div className="cs-head__title loadout__title">
          <Zap size={18} /> Runas y objetos · {championName}
        </div>
        <Badge variant={loadout?.clientConnected ? 'win' : 'neutral'}>
          {loadout ? (loadout.clientConnected ? 'Cliente conectado' : 'Cliente cerrado') : 'Cargando'}
        </Badge>
      </div>

      {loadError && <p className="loadout__error">{loadError}</p>}
      {!loadout && !loadError && <div className="loadout__loading"><Spinner size="sm" /> Leyendo recomendaciones…</div>}

      {loadout && (
        <div className="cs-grid loadout__grid">
          <section className="cs-panel loadout__section">
            <h3 className="loadout__heading">Runas recomendadas por el cliente</h3>
            {loadout.runePages.length > 1 && (
              <div className="loadout__tabs" role="tablist" aria-label="Página de runas">
                {loadout.runePages.map((option, index) => (
                  <button
                    key={`${option.position ?? 'any'}-${option.primaryStyleId}-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={index === pageIndex}
                    className={`loadout__tab ${index === pageIndex ? 'is-active' : ''}`}
                    onClick={() => {
                      setPageIndex(index);
                      setRuneState(IDLE);
                    }}
                  >
                    {option.perks[0]?.name || RUNE_STYLE_NAMES[option.primaryStyleId] || 'Página'}
                  </button>
                ))}
              </div>
            )}
            {page ? (
              <>
                <p className="loadout__styles">
                  {RUNE_STYLE_NAMES[page.primaryStyleId] ?? 'Principal'} + {RUNE_STYLE_NAMES[page.subStyleId] ?? 'Secundaria'}
                </p>
                <ul className="loadout__perks">
                  {page.perks.map((perk, index) => {
                    const icon = runeIconUrl(perk.iconPath);
                    return (
                      <li key={`${perk.id}-${index}`} className={index === 0 ? 'is-keystone' : ''}>
                        {icon && <img src={icon} alt="" width={index === 0 ? 28 : 20} height={index === 0 ? 28 : 20} loading="lazy" />}
                        <span>{perk.name || `Runa ${perk.id}`}</span>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  className="loadout__action"
                  onClick={applyRunes}
                  disabled={runeState.status === 'working' || !loadout.clientConnected}
                >
                  {runeState.status === 'working' ? 'Importando…' : runeState.status === 'done' ? <><Check size={14} /> Importadas</> : 'Importar runas'}
                </button>
              </>
            ) : (
              <p className="loadout__empty">
                {loadout.clientConnected ? 'El cliente no tiene recomendaciones para este campeón.' : 'Abre el cliente de League para ver las runas.'}
              </p>
            )}
            {runeState.message && (
              <p className={runeState.status === 'error' ? 'loadout__error' : 'loadout__ok'}>{runeState.message}</p>
            )}
          </section>

          <section className="cs-panel loadout__section">
            <h3 className="loadout__heading"><Package size={14} /> Tu build habitual</h3>
            {build && build.itemIds.length > 0 ? (
              <>
                <p className="loadout__styles">Según {build.games} {build.games === 1 ? 'partida' : 'partidas'} con {championName}</p>
                <ul className="loadout__items">
                  {build.itemIds.map((itemId) => (
                    <li key={itemId}>
                      <img src={assetResolver.getItemIcon(itemId)} alt={`Objeto ${itemId}`} width={36} height={36} loading="lazy" />
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="loadout__action"
                  onClick={applyItems}
                  disabled={itemState.status === 'working' || !loadout.clientConnected}
                >
                  {itemState.status === 'working' ? 'Importando…' : itemState.status === 'done' ? <><Check size={14} /> Importados</> : 'Importar objetos'}
                </button>
              </>
            ) : (
              <p className="loadout__empty">
                Aún no hay partidas tuyas con {championName} en el historial. Juega algunas y la build aparecerá aquí.
              </p>
            )}
            {itemState.message && (
              <p className={itemState.status === 'error' ? 'loadout__error' : 'loadout__ok'}>{itemState.message}</p>
            )}
          </section>
        </div>
      )}
    </Card>
  );
};
