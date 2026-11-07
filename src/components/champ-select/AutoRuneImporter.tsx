import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Lightbulb, Package, Sparkles, Swords, Zap } from 'lucide-react';
import { Badge, Card, Spinner } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import { audioService } from '../../services/audioService';
import { useUserSettings } from '../../hooks/useUserSettings';
import { SUMMONER_SPELLS, orderSpells } from '../../services/spellOrder';
import {
  RUNE_STYLE_NAMES,
  autoImportKey,
  claimAutoImport,
  fetchLoadout,
  importItems,
  importRunes,
  importSpells,
  runeIconUrl,
  type Loadout,
  type RunePage,
} from '../../services/loadoutClient';
import { messageFromUnknown } from '../../services/userErrors';
import './champSelect.css';

export interface AutoRuneImporterProps {
  championId: number;
  championName: string;
  position?: string;
  /** True once the pick is locked in: the meta build is imported without a click. */
  locked: boolean;
}

type ImportState = { status: 'idle' | 'working' | 'done' | 'error'; message?: string };

const IDLE: ImportState = { status: 'idle' };

/**
 * OP.GG meta runes and items: against the lane opponent when champion select
 * shows them, otherwise the champion's general build. Client pages stay as
 * alternatives. The badge only says "importado" after the client confirmed it.
 */
export const AutoRuneImporter: React.FC<AutoRuneImporterProps> = ({ championId, championName, position, locked }) => {
  const [loadout, setLoadout] = useState<Loadout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [runeState, setRuneState] = useState<ImportState>(IDLE);
  const [itemState, setItemState] = useState<ImportState>(IDLE);
  const [spellState, setSpellState] = useState<ImportState>(IDLE);
  const { settings } = useUserSettings();
  const prefs = settings.loadout;
  const [autoNote, setAutoNote] = useState<string | null>(null);

  // The parent remounts this card (key) when the champion, lane or enemy picks change.
  useEffect(() => {
    let cancelled = false;
    fetchLoadout(championId, position)
      .then((body) => {
        if (!cancelled) setLoadout(body);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(messageFromUnknown(error));
      });
    return () => {
      cancelled = true;
    };
  }, [championId, position]);

  const name = loadout?.championName || championName;
  const page = loadout?.runePages[pageIndex] ?? null;
  const blocks = loadout?.itemBlocks ?? [];
  const recommendedSpells = loadout?.summonerSpellIds ?? page?.summonerSpellIds;
  // Stable [D, F] pair so the auto-import effect only reruns when it really changes.
  const spells = useMemo(
    () => orderSpells(recommendedSpells ?? [], prefs.flashKey),
    [recommendedSpells, prefs.flashKey],
  );

  const applyRunes = useCallback(async (target: RunePage, silent = false) => {
    if (!silent) audioService.playClick();
    setRuneState({ status: 'working' });
    try {
      await importRunes(name, target);
      setRuneState({ status: 'done', message: 'Runas aplicadas.' });
      if (!silent) audioService.playSuccess();
    } catch (error) {
      setRuneState({ status: 'error', message: messageFromUnknown(error) });
    }
  }, [name]);

  const applyItems = useCallback(async (silent = false) => {
    if (!loadout || loadout.itemBlocks.length === 0) return;
    if (!silent) audioService.playClick();
    setItemState({ status: 'working' });
    try {
      await importItems(loadout.championId, name, loadout.itemBlocks);
      setItemState({ status: 'done', message: 'Conjunto creado en la tienda del cliente.' });
      if (!silent) audioService.playSuccess();
    } catch (error) {
      setItemState({ status: 'error', message: messageFromUnknown(error) });
    }
  }, [loadout, name]);

  const applySpells = useCallback(async (silent = false) => {
    if (!spells) return;
    if (!silent) audioService.playClick();
    setSpellState({ status: 'working' });
    try {
      await importSpells(spells);
      const [d, f] = spells.map((id) => SUMMONER_SPELLS[id]?.name ?? `Hechizo ${id}`);
      setSpellState({ status: 'done', message: `${d} en D y ${f} en F.` });
      if (!silent) audioService.playSuccess();
    } catch (error) {
      setSpellState({ status: 'error', message: messageFromUnknown(error) });
    }
  }, [spells]);

  // Locked pick: import what Settings has switched on, once per champion and opponent.
  useEffect(() => {
    if (!locked || !loadout?.clientConnected || loadout.source !== 'opgg') return;
    const first = loadout.runePages[0];
    if (!first || first.source !== 'opgg') return;
    const tasks: { label: string; run: () => Promise<void> }[] = [];
    if (prefs.autoRunes) tasks.push({ label: 'runas', run: () => applyRunes(first, true) });
    if (prefs.autoItems && loadout.itemBlocks.length > 0) tasks.push({ label: 'objetos', run: () => applyItems(true) });
    if (prefs.autoSpells && spells) tasks.push({ label: 'hechizos', run: () => applySpells(true) });
    if (tasks.length === 0) return;
    if (!claimAutoImport(autoImportKey(loadout))) return;
    const versus = loadout.opponent ? ` contra ${loadout.opponent.name}` : '';
    const labels = tasks.map((task) => task.label);
    const list = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}` : labels[0];
    // Started after the effect so the import's state updates stay asynchronous.
    void Promise.resolve().then(() => Promise.all(tasks.map((task) => task.run()))).then(() => {
      setAutoNote(`Se importaron ${list} automáticamente${versus}.`);
      audioService.playSuccess();
    });
  }, [locked, loadout, prefs.autoRunes, prefs.autoItems, prefs.autoSpells, spells, applyRunes, applyItems, applySpells]);

  const sourceBadge = loadout?.source === 'opgg' ? 'OP.GG' : loadout?.source === 'client' ? 'Cliente de League' : 'Sin datos';

  return (
    <Card variant="cyan" className="card--fit loadout">
      <div className="cs-head">
        <div className="cs-head__title loadout__title">
          <Zap size={18} /> Runas y objetos · {name}
          {loadout?.opponent && <span className="loadout__versus"><Swords size={13} /> vs {loadout.opponent.name}</span>}
        </div>
        <Badge variant={loadout?.source === 'opgg' ? 'win' : 'neutral'}>
          {loadout ? sourceBadge : 'Cargando'}
        </Badge>
      </div>

      {loadError && <p className="loadout__error">{loadError}</p>}
      {!loadout && !loadError && <div className="loadout__loading"><Spinner size="sm" /> Buscando la build meta…</div>}
      {loadout?.notice && <p className="loadout__empty">{loadout.notice}</p>}
      {autoNote && <p className="loadout__ok">{autoNote}</p>}
      {loadout && !loadout.opponent && loadout.source === 'opgg' && (
        <p className="loadout__empty">Build meta general. Cuando el rival de línea elija, se ajusta al matchup.</p>
      )}

      {loadout && loadout.clientConnected && (
        <div className="cs-grid loadout__grid">
          <section className="cs-panel loadout__section">
            <h3 className="loadout__heading">Runas</h3>
            {loadout.runePages.length > 1 && (
              <div className="loadout__tabs" role="tablist" aria-label="Página de runas">
                {loadout.runePages.map((option, index) => (
                  <button
                    key={`${option.source}-${option.primaryStyleId}-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={index === pageIndex}
                    className={`loadout__tab ${index === pageIndex ? 'is-active' : ''}`}
                    onClick={() => {
                      setPageIndex(index);
                      setRuneState(IDLE);
                    }}
                  >
                    {option.source === 'opgg' ? option.label : option.perks[0]?.name || 'Cliente'}
                  </button>
                ))}
              </div>
            )}
            {page ? (
              <>
                <p className="loadout__styles">
                  {RUNE_STYLE_NAMES[page.primaryStyleId] ?? 'Principal'} + {RUNE_STYLE_NAMES[page.subStyleId] ?? 'Secundaria'}
                  {page.pickRate ? ` · ${Math.round(page.pickRate * 100)}% de uso` : ''}
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
                  onClick={() => void applyRunes(page)}
                  disabled={runeState.status === 'working'}
                >
                  {runeState.status === 'working' ? 'Importando…' : runeState.status === 'done' ? <><Check size={14} /> Importadas</> : 'Importar runas'}
                </button>
              </>
            ) : (
              <p className="loadout__empty">No hay recomendaciones de runas para este campeón.</p>
            )}
            {runeState.message && (
              <p className={runeState.status === 'error' ? 'loadout__error' : 'loadout__ok'}>{runeState.message}</p>
            )}
          </section>

          <section className="cs-panel loadout__section">
            <h3 className="loadout__heading"><Sparkles size={14} /> Hechizos</h3>
            {spells ? (
              <>
                <ul className="loadout__spells">
                  {spells.map((spellId, index) => {
                    const spell = SUMMONER_SPELLS[spellId];
                    return (
                      <li key={spellId}>
                        <span className="loadout__spell-key">{index === 0 ? 'D' : 'F'}</span>
                        {spell && (
                          <img src={assetResolver.getSummonerSpellIcon(spell.key)} alt="" width={28} height={28} loading="lazy" />
                        )}
                        <span>{spell?.name ?? `Hechizo ${spellId}`}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="loadout__styles">Destello va en {prefs.flashKey} (cámbialo en Ajustes).</p>
                <button
                  type="button"
                  className="loadout__action"
                  onClick={() => void applySpells()}
                  disabled={spellState.status === 'working'}
                >
                  {spellState.status === 'working' ? 'Importando…' : spellState.status === 'done' ? <><Check size={14} /> Importados</> : 'Importar hechizos'}
                </button>
              </>
            ) : (
              <p className="loadout__empty">No hay hechizos recomendados para esta build.</p>
            )}
            {spellState.message && (
              <p className={spellState.status === 'error' ? 'loadout__error' : 'loadout__ok'}>{spellState.message}</p>
            )}
          </section>

          <section className="cs-panel loadout__section">
            <h3 className="loadout__heading"><Package size={14} /> Objetos</h3>
            {blocks.length > 0 ? (
              <>
                {blocks.map((block) => (
                  <div key={block.title} className="loadout__block">
                    <span className="loadout__block-title">{block.title}</span>
                    <ul className="loadout__items">
                      {block.itemIds.map((itemId, index) => (
                        <li key={`${itemId}-${index}`}>
                          <img src={assetResolver.getItemIcon(itemId)} alt={`Objeto ${itemId}`} width={32} height={32} loading="lazy" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {loadout.skillOrder && loadout.skillOrder.length > 0 && (
                  <p className="loadout__styles">Habilidades: {loadout.skillOrder.join(' > ')}</p>
                )}
                <button
                  type="button"
                  className="loadout__action"
                  onClick={() => void applyItems()}
                  disabled={itemState.status === 'working'}
                >
                  {itemState.status === 'working' ? 'Importando…' : itemState.status === 'done' ? <><Check size={14} /> Importados</> : 'Importar objetos'}
                </button>
              </>
            ) : (
              <p className="loadout__empty">OP.GG no tiene objetos para este campeón y línea ahora mismo.</p>
            )}
            {itemState.message && (
              <p className={itemState.status === 'error' ? 'loadout__error' : 'loadout__ok'}>{itemState.message}</p>
            )}
          </section>
        </div>
      )}

      {loadout?.tip && (
        <p className="loadout__tip"><Lightbulb size={14} /> {loadout.tip}</p>
      )}
    </Card>
  );
};
