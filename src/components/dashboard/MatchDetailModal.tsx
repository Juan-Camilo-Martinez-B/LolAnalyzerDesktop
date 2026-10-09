import React from 'react';
import { Activity, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge, Modal } from '../ui';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { assetResolver } from '../../services/assetResolver';
import type { MatchRecord } from '../../types/game';
import './matchHistory.css';

export interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchRecord | null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es').format(value);
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  isOpen,
  onClose,
  match,
}) => {
  if (!isOpen || !match) return null;

  const isWin = Boolean(match.isWin ?? match.win ?? match.localParticipant?.win);
  const championName = match.championName ?? match.localParticipant?.championName ?? 'Unknown';
  const kills = match.kills ?? match.localParticipant?.kills ?? 0;
  const deaths = match.deaths ?? match.localParticipant?.deaths ?? 0;
  const assists = match.assists ?? match.localParticipant?.assists ?? 0;
  const durationSecTotal = match.durationSec ?? match.gameDuration ?? 0;
  const durationMin = Math.floor(durationSecTotal / 60);
  const durationSec = durationSecTotal % 60;
  const kda = match.kda ?? (deaths > 0 ? (kills + assists) / deaths : kills + assists);
  const items = (match.items ?? match.localParticipant?.items ?? []).filter((itemId) => itemId > 0);
  const stats = [
    { label: 'Rol', value: match.role ?? match.localParticipant?.role ?? '—' },
    { label: 'CS', value: `${match.cs ?? match.localParticipant?.totalCS ?? 0} (${(match.csPerMin ?? 0).toFixed(1)}/min)` },
    { label: 'Oro', value: formatNumber(match.goldEarned ?? match.localParticipant?.goldEarned ?? 0) },
    { label: 'Visión', value: formatNumber(match.visionScore ?? match.localParticipant?.visionScore ?? 0) },
    { label: 'Daño a campeones', value: formatNumber(match.damageDealt ?? match.localParticipant?.damageDealtToChampions ?? 0) },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="var(--hextech-gold)" />
          <span>Detalle de la partida</span>
        </div>
      }
    >
      <div className="match-detail__body" style={{ padding: 0 }}>
        <div className={isWin ? 'match-detail__banner match-detail__banner--win' : 'match-detail__banner'} style={{ position: 'relative', height: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ChampionAvatar championName={championName} size="lg" variant={isWin ? 'cyan' : 'danger'} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <Badge variant={isWin ? 'win' : 'loss'} icon={isWin ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}>
                    {isWin ? 'VICTORY' : 'DEFEAT'}
                  </Badge>
                  <span className="match-detail__duration">
                    <Clock size={14} /> {durationMin}m {durationSec}s • {match.gameMode || 'Partida'}
                  </span>
                </div>
                <h2 className="match-detail__title">{championName}</h2>
                <p className="match-detail__sub">{match.matchId}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="match-detail__kda" style={{ fontSize: '1.5rem' }}>
                <span style={{ color: 'var(--accent-green)' }}>{kills}</span>
                {' / '}
                <span style={{ color: 'var(--accent-red)' }}>{deaths}</span>
                {' / '}
                <span style={{ color: 'var(--hextech-cyan)' }}>{assists}</span>
              </div>
              <div className="match-row__meta">{kda.toFixed(2)} KDA</div>
            </div>
          </div>
        </div>

        <div className="match-detail__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="match-detail__stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <div>
          <div className="match-row__mode" style={{ marginBottom: 8 }}>Objetos</div>
          <div className="match-row__items">
            {items.length > 0 ? items.map((itemId, index) => (
              <img
                key={`${itemId}-${index}`}
                src={assetResolver.getItemIcon(itemId)}
                alt={`Item ${itemId}`}
                className="match-row__item"
                style={{ width: 36, height: 36 }}
              />
            )) : (
              <span className="match-detail__sub">Esta partida no trajo objetos.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
