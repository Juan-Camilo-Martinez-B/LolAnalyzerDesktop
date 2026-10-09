import React from 'react';
import { Ban, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Card, Badge } from '../ui';
import { audioService } from '../../services/audioService';
import './champSelect.css';

export interface BanRecommendation {
  championId: number;
  championName: string;
  role: string;
  winrate: number;
  banrate: number;
  threatLevel: 'critical' | 'high' | 'medium';
  reason: string;
}

export interface BanRecommendationWidgetProps {
  onBanSelect?: (championId: number, championName: string) => void;
}

export const BanRecommendationWidget: React.FC<BanRecommendationWidgetProps> = ({
  onBanSelect,
}) => {
  const recommendations: BanRecommendation[] = [
    {
      championId: 238,
      championName: 'Zed',
      role: 'MID',
      winrate: 53.4,
      banrate: 42.1,
      threatLevel: 'critical',
      reason: 'Mayor amenaza directa para tu champ pool de magos de control. 62% WR vs Ahri/Lissandra.',
    },
    {
      championId: 555,
      championName: 'Pyke',
      role: 'SUPPORT',
      winrate: 52.8,
      banrate: 34.5,
      threatLevel: 'high',
      reason: 'Alta capacidad de roaming en early game amenazando la línea media.',
    },
    {
      championId: 121,
      championName: 'Khazix',
      role: 'JUNGLE',
      winrate: 54.1,
      banrate: 28.9,
      threatLevel: 'medium',
      reason: 'S+ Tier en el parche actual con dominancia en escaramuzas de escarabajos.',
    },
  ];

  const handleBanClick = (rec: BanRecommendation) => {
    audioService.playWarning();
    if (onBanSelect) {
      onBanSelect(rec.championId, rec.championName);
    }
  };

  return (
    <Card variant="danger" className="card--fit">
      <div className="cs-head">
        <div className="cs-head__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
          <Ban size={18} /> Recommended High-Priority Bans
        </div>
        <Badge variant="danger">Ban Phase Active</Badge>
      </div>

      {/* Ban Items Grid */}
      <div className="cs-grid">
        {recommendations.map((rec) => {
          const isCritical = rec.threatLevel === 'critical';

          return (
            <div
              key={rec.championId}
              style={{
                background: 'var(--bg-glass-heavy)',
                border: isCritical ? '1px solid var(--accent-red)' : '1px solid var(--border-dark)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <ChampionAvatar championName={rec.championName} size="sm" variant="danger" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {rec.championName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {rec.role} • {rec.winrate}% WR
                    </div>
                  </div>
                </div>

                <Badge variant={isCritical ? 'danger' : 'gold'}>
                  {rec.threatLevel.toUpperCase()}
                </Badge>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0, overflowWrap: 'anywhere' }}>
                {rec.reason}
              </p>

              <button
                onClick={() => handleBanClick(rec)}
                style={{
                  background: isCritical ? 'rgba(255, 70, 85, 0.2)' : 'var(--bg-glass-medium)',
                  color: 'var(--accent-red)',
                  border: '1px solid var(--accent-red)',
                  borderRadius: '6px',
                  padding: '6px 10px',
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
                <Ban size={12} /> Ban {rec.championName}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
