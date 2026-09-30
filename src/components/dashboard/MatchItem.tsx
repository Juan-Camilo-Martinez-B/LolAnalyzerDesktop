import React from 'react';
import { Clock, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Badge, Card } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import type { MatchRecord } from '../../types/game';

export interface MatchItemProps {
  match: MatchRecord;
  onSelectMatch: (matchId: string) => void;
}

function MatchItemView({ match, onSelectMatch }: MatchItemProps) {
  const isWin = match.isWin ?? match.win ?? match.localParticipant?.win ?? true;
  const durationSecTotal = match.durationSec ?? match.gameDuration ?? 1680;
  const durationMin = Math.floor(durationSecTotal / 60);
  const durationSec = durationSecTotal % 60;

  const timestampStr = match.timestamp ?? (match.gameCreation ? new Date(match.gameCreation).toISOString() : new Date().toISOString());
  const dateObj = new Date(timestampStr);
  const timeAgo = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const champName = match.championName ?? match.localParticipant?.championName ?? 'Ahri';
  const roleName = match.role ?? match.localParticipant?.role ?? 'MID';
  const kills = match.kills ?? match.localParticipant?.kills ?? 0;
  const deaths = match.deaths ?? match.localParticipant?.deaths ?? 0;
  const assists = match.assists ?? match.localParticipant?.assists ?? 0;
  const kdaVal = match.kda ?? (deaths > 0 ? (kills + assists) / deaths : kills + assists);
  const csVal = match.cs ?? match.localParticipant?.totalCS ?? 0;
  const csPerMinVal = match.csPerMin ?? (durationSecTotal > 0 ? (csVal / (durationSecTotal / 60)) : 0);

  const items = match.items ?? match.localParticipant?.items ?? [3006, 6672, 3031, 3072, 3033, 3156];
  const trinketId = match.trinketId ?? 3363;

  return (
    <Card
      variant={isWin ? 'cyan' : 'danger'}
      className="match-item-card"
      style={{
        padding: '14px 18px',
        background: isWin
          ? 'linear-gradient(90deg, rgba(10, 200, 185, 0.08) 0%, rgba(11, 14, 20, 0.95) 40%)'
          : 'linear-gradient(90deg, rgba(255, 70, 85, 0.08) 0%, rgba(11, 14, 20, 0.95) 40%)',
        marginBottom: '12px',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: Result Badge + Game Mode + Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '85px' }}>
            <Badge variant={isWin ? 'win' : 'loss'} icon={isWin ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}>
              {isWin ? 'VICTORY' : 'DEFEAT'}
            </Badge>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {match.gameMode || 'Ranked Solo'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Clock size={10} /> {durationMin}m {durationSec}s • {timeAgo}
            </div>
          </div>

          {/* Champion Avatar & Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ChampionAvatar
              championName={champName}
              size="md"
              variant={isWin ? 'cyan' : 'danger'}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {champName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {roleName}
              </div>
            </div>
          </div>
        </div>

        {/* Center: KDA Stats */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-green)' }}>{kills}</span> /{' '}
            <span style={{ color: 'var(--accent-red)' }}>{deaths}</span> /{' '}
            <span style={{ color: 'var(--hextech-cyan)' }}>{assists}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--hextech-gold)', fontWeight: 600, marginTop: '2px' }}>
            {kdaVal.toFixed(2)} KDA ({csVal} CS • {csPerMinVal.toFixed(1)}/m)
          </div>
        </div>

        {/* Right: Items Build Grid & Drilldown Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Items Icons Grid */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {items.slice(0, 6).map((itemId: number, idx: number) => (
                <img
                  key={idx}
                  src={assetResolver.getItemIcon(itemId)}
                  alt={`Item ${itemId}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/0.png';
                  }}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-dark)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                />
              ))}
            </div>

            {/* Trinket */}
            <img
              src={assetResolver.getItemIcon(trinketId)}
              alt="Trinket"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '1px solid var(--border-gold)',
                marginLeft: '4px',
              }}
            />
          </div>

          {/* Drilldown Button */}
          <button
            onClick={() => onSelectMatch(match.matchId)}
            style={{
              background: 'var(--bg-glass-heavy)',
              border: '1px solid var(--border-gold)',
              color: 'var(--hextech-gold)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            className="btn-drilldown"
          >
            Details <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export const MatchItem = React.memo(MatchItemView);
