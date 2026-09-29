import React from 'react';
import { Sparkles, ShieldAlert, Swords, Check } from 'lucide-react';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Card, Badge } from '../ui';
import { audioService } from '../../services/audioService';
import type { ChampionRecommendation } from '../../types/coach';

export interface CounterPickPanelProps {
  recommendations?: ChampionRecommendation[];
  onSelectChampion?: (championId: number, championName: string) => void;
}

export const CounterPickPanel: React.FC<CounterPickPanelProps> = ({
  recommendations,
  onSelectChampion,
}) => {
  // Default recommendations if API pending
  const defaultRecs: Array<ChampionRecommendation & { winrateVsEnemy: number; synergyScore: number; tags: string[] }> = [
    {
      championId: 103,
      championName: 'Ahri',
      role: 'MID',
      reason: 'Excelente movilidad post-6 para esquivar el combo de Zed + Alta sinergia con LeeSin para ganks.',
      winrateVsEnemy: 56.8,
      synergyScore: 92,
      tags: ['Mobility Counter', 'Gank Setup', 'AP Balance'],
    },
    {
      championId: 127,
      championName: 'Lissandra',
      role: 'MID',
      reason: 'Hard CC garantizado con R para bloquear la entrada de Zed y denegar ejecuciones.',
      winrateVsEnemy: 58.2,
      synergyScore: 88,
      tags: ['Hard CC', 'Point & Click R', 'Anti-Assassin'],
    },
    {
      championId: 268,
      championName: 'Azir',
      role: 'MID',
      reason: 'Control de espacio en peleas de equipo con R (Emperor\'s Divide) y escala superior a late-game.',
      winrateVsEnemy: 52.4,
      synergyScore: 84,
      tags: ['Zone Control', 'Late Game Hypercarry'],
    },
  ];

  const handlePickClick = (rec: { championId: number; championName: string }) => {
    audioService.playClick();
    if (onSelectChampion) {
      onSelectChampion(rec.championId, rec.championName);
    }
  };

  return (
    <Card variant="gold">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hextech-gold)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
          <Sparkles size={18} /> AI Counter-Pick & Synergy Recommendations
        </div>
        <Badge variant="gold">Matchup vs ZED (Enemy Mid)</Badge>
      </div>

      {/* Recommendations Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {defaultRecs.map((rec, idx) => (
          <div
            key={rec.championId}
            style={{
              background: 'var(--bg-glass-heavy)',
              border: idx === 0 ? '1px solid var(--hextech-gold)' : '1px solid var(--border-dark)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: idx === 0 ? '0 0 12px rgba(200, 155, 60, 0.15)' : 'none',
              position: 'relative',
            }}
          >
            {/* Top Match Rank Tag */}
            {idx === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '12px',
                  background: 'var(--hextech-gold)',
                  color: 'var(--hextech-black)',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                }}
              >
                #1 Best Pick
              </div>
            )}

            {/* Champion Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ChampionAvatar championName={rec.championName} size="md" variant={idx === 0 ? 'gold' : 'cyan'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {rec.championName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700, marginTop: '2px' }}>
                  {rec.winrateVsEnemy}% Matchup WR • {rec.synergyScore}% Synergy
                </div>
              </div>
            </div>

            {/* Reason Description */}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {rec.reason}
            </p>

            {/* Reason Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {rec.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-dark)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Select Button */}
            <button
              onClick={() => handlePickClick(rec)}
              style={{
                background: idx === 0 ? 'var(--hextech-gold)' : 'var(--bg-glass-medium)',
                color: idx === 0 ? 'var(--hextech-black)' : 'var(--hextech-gold)',
                border: '1px solid var(--border-gold)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Check size={14} /> Hover & Preview Pick
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};
