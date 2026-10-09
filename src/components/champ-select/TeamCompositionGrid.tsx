import React from 'react';
import { Shield, Swords, Ban, CheckCircle, Lock, UserCheck } from 'lucide-react';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Badge, Card } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import type { ChampSelectMember } from '../../types/game';
import './champSelect.css';

export interface TeamCompositionGridProps {
  myTeam?: ChampSelectMember[];
  theirTeam?: ChampSelectMember[];
  bans?: { myTeamBans: number[]; theirTeamBans: number[] };
}

export const TeamCompositionGrid: React.FC<TeamCompositionGridProps> = ({
  myTeam = [],
  theirTeam = [],
  bans = { myTeamBans: [122, 157, 238, 84, 555], theirTeamBans: [103, 64, 222, 11, 268] },
}) => {
  // Default mock slots for 5 positions if empty
  const defaultRoles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  
  const mockMyTeam: ChampSelectMember[] = defaultRoles.map((role, idx) => ({
    cellId: idx,
    championId: [266, 64, 103, 222, 412][idx],
    championName: ['Aatrox', 'LeeSin', 'Ahri', 'Jinx', 'Thresh'][idx],
    assignedPosition: role,
    spell1Id: 4,
    spell2Id: 12,
    summonerName: ['Summoner 1', 'Summoner 2', 'You (Ahri)', 'Summoner 4', 'Summoner 5'][idx],
    isLocalPlayer: idx === 2,
  }));

  const mockTheirTeam: ChampSelectMember[] = defaultRoles.map((role, idx) => ({
    cellId: idx + 5,
    championId: [83, 121, 238, 145, 111][idx],
    championName: ['Yorick', 'Khazix', 'Zed', 'Kaisa', 'Nautilus'][idx],
    assignedPosition: role,
    spell1Id: 4,
    spell2Id: 14,
    summonerName: `Enemy ${idx + 1}`,
    isLocalPlayer: false,
  }));

  const allyList = myTeam.length > 0 ? myTeam : mockMyTeam;
  const enemyList = theirTeam.length > 0 ? theirTeam : mockTheirTeam;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banned Champions Banner */}
      <Card variant="default" className="card--fit" style={{ padding: '12px 18px' }}>
        <div className="ban-strip">
          <div className="ban-strip__side">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--hextech-cyan)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Ban size={14} /> Ally Bans
            </div>
            <div className="ban-strip__icons">
              {bans.myTeamBans.map((champId, idx) => (
                <div key={idx} style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-dark)' }}>
                  <img
                    src={assetResolver.getItemIcon(champId)} // Fallback item if champ ID mapped
                    alt={`Ban ${champId}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                    }}
                    style={{ width: '100%', height: '100%', filter: 'grayscale(100%) opacity(0.6)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', fontWeight: 900, fontSize: '0.9rem' }}>✕</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--hextech-gold)', letterSpacing: '0.05em' }}>
            VS
          </div>

          {/* Enemy Bans */}
          <div className="ban-strip__side">
            <div className="ban-strip__icons">
              {bans.theirTeamBans.map((champId, idx) => (
                <div key={idx} style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-dark)' }}>
                  <img
                    src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"
                    alt={`Enemy Ban ${champId}`}
                    style={{ width: '100%', height: '100%', filter: 'grayscale(100%) opacity(0.6)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', fontWeight: 900, fontSize: '0.9rem' }}>✕</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Enemy Bans <Ban size={14} />
            </div>
          </div>
        </div>
      </Card>

      {/* Team Composition Grid (2 Columns: Ally vs Enemy) */}
      <div className="team-grid">
        {/* ALLY TEAM COLUMN */}
        <Card variant="cyan" className="card--fit">
          <div className="cs-head">
            <div className="cs-head__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hextech-cyan)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
              <Shield size={18} /> Ally Team
            </div>
          </div>

          <div className="draft-stack">
            {allyList.map((member, idx) => {
              const roleEmblem = assetResolver.getRoleEmblem(member.assignedPosition || 'MID');

              return (
                <div
                  key={idx}
                  className={member.isLocalPlayer ? 'draft-row draft-row--you' : 'draft-row'}
                >
                  <div className="draft-row__who">
                    <img src={roleEmblem} alt={member.assignedPosition} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    <ChampionAvatar championName={member.championName || 'Unknown'} size="sm" variant={member.isLocalPlayer ? 'cyan' : 'gold'} />
                    <div className="draft-row__copy">
                      <div className="draft-row__name" style={{ color: member.isLocalPlayer ? 'var(--hextech-cyan)' : undefined }}>
                        {member.summonerName} {member.isLocalPlayer ? '(You)' : ''}
                      </div>
                      <div className="draft-row__champ">
                        {member.championName || 'Selecting...'}
                      </div>
                    </div>
                  </div>

                  <Badge variant={member.isLocalPlayer ? 'cyan' : 'neutral'}>
                    {member.assignedPosition || 'FILL'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ENEMY TEAM COLUMN */}
        <Card variant="danger" className="card--fit">
          <div className="cs-head">
            <div className="cs-head__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
              <Swords size={18} /> Enemy Team
            </div>
          </div>

          <div className="draft-stack">
            {enemyList.map((member, idx) => {
              const roleEmblem = assetResolver.getRoleEmblem(member.assignedPosition || 'MID');

              return (
                <div key={idx} className="draft-row">
                  <div className="draft-row__who">
                    <img src={roleEmblem} alt={member.assignedPosition} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    <ChampionAvatar championName={member.championName || 'Unknown'} size="sm" variant="danger" />
                    <div className="draft-row__copy">
                      <div className="draft-row__name">{member.summonerName}</div>
                      <div className="draft-row__champ">{member.championName || 'Selecting...'}</div>
                    </div>
                  </div>

                  <Badge variant="danger">
                    {member.assignedPosition || 'FILL'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
