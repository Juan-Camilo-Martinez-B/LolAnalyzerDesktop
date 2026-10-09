import React from 'react';
import { Clock, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Badge, Card } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import type { MatchRecord } from '../../types/game';
import './matchHistory.css';

export interface MatchItemProps {
  match: MatchRecord;
  onSelectMatch: (match: MatchRecord) => void;
}

function MatchItemView({ match, onSelectMatch }: MatchItemProps) {
  const isWin = Boolean(match.isWin ?? match.win ?? match.localParticipant?.win);
  const durationSecTotal = match.durationSec ?? match.gameDuration ?? 0;
  const durationMin = Math.floor(durationSecTotal / 60);
  const durationSec = durationSecTotal % 60;

  const timestampStr = match.timestamp ?? (match.gameCreation ? new Date(match.gameCreation).toISOString() : '');
  const timeAgo = timestampStr
    ? new Date(timestampStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  const champName = match.championName ?? match.localParticipant?.championName ?? 'Unknown';
  const roleName = match.role ?? match.localParticipant?.role ?? 'UNKNOWN';
  const kills = match.kills ?? match.localParticipant?.kills ?? 0;
  const deaths = match.deaths ?? match.localParticipant?.deaths ?? 0;
  const assists = match.assists ?? match.localParticipant?.assists ?? 0;
  const kdaVal = match.kda ?? (deaths > 0 ? (kills + assists) / deaths : kills + assists);
  const csVal = match.cs ?? match.localParticipant?.totalCS ?? 0;
  const csPerMinVal = match.csPerMin ?? (durationSecTotal > 0 ? (csVal / (durationSecTotal / 60)) : 0);

  const items = (match.items ?? match.localParticipant?.items ?? []).slice(0, 6);
  const slots = Array.from({ length: 6 }, (_, index) => items[index] ?? 0);
  const trinketId = match.trinketId ?? 0;

  return (
    <Card
      variant={isWin ? 'cyan' : 'danger'}
      className={isWin ? 'match-row match-row--win' : 'match-row'}
    >
      <div className="match-row__body">
        {/* Left: Result Badge + Game Mode + Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="match-row__result">
            <Badge variant={isWin ? 'win' : 'loss'} icon={isWin ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}>
              {isWin ? 'VICTORY' : 'DEFEAT'}
            </Badge>
            <div className="match-row__mode">{match.gameMode || 'Partida'}</div>
            <div className="match-row__time">
              <Clock size={10} /> {durationMin}m {durationSec}s{timeAgo ? ` • ${timeAgo}` : ''}
            </div>
          </div>

          <div className="match-row__champ">
            <ChampionAvatar
              championName={champName}
              size="md"
              variant={isWin ? 'cyan' : 'danger'}
            />
            <div>
              <div className="match-row__name">{champName}</div>
              <div className="match-row__role">{roleName}</div>
            </div>
          </div>
        </div>

        <div className="match-row__kda">
          <div>
            <span style={{ color: 'var(--accent-green)' }}>{kills}</span> /{' '}
            <span style={{ color: 'var(--accent-red)' }}>{deaths}</span> /{' '}
            <span style={{ color: 'var(--hextech-cyan)' }}>{assists}</span>
          </div>
          <div className="match-row__meta">
            {kdaVal.toFixed(2)} KDA ({csVal} CS • {csPerMinVal.toFixed(1)}/m)
          </div>
        </div>

        <div className="match-row__build">
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div className="match-row__items">
              {slots.map((itemId, idx) => (
                itemId > 0 ? (
                  <img
                    key={idx}
                    src={assetResolver.getItemIcon(itemId)}
                    alt={`Item ${itemId}`}
                    className="match-row__item"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/0.png';
                    }}
                  />
                ) : (
                  <span key={idx} className="match-row__item" />
                )
              ))}
            </div>
            {trinketId > 0 && (
              <img
                src={assetResolver.getItemIcon(trinketId)}
                alt="Trinket"
                className="match-row__trinket"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectMatch(match)}
            className="match-row__details"
          >
            Details <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export const MatchItem = React.memo(MatchItemView);
