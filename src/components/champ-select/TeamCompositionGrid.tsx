import React from 'react';
import { Shield, Swords, Ban, CheckCircle, Lock, UserCheck } from 'lucide-react';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { Badge, Card } from '../ui';
import { assetResolver } from '../../services/assetResolver';
import type { ChampSelectMember } from '../../types/game';

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
      <Card variant="default" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Ally Bans */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--hextech-cyan)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Ban size={14} /> Ally Bans:
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
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
        <Card variant="cyan">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--hextech-cyan)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
            <Shield size={18} /> Ally Team
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allyList.map((member, idx) => {
              const roleEmblem = assetResolver.getRoleEmblem(member.assignedPosition || 'MID');

              return (
                <div
                  key={idx}
                  style={{
                    background: member.isLocalPlayer ? 'rgba(10, 200, 185, 0.12)' : 'var(--bg-glass-heavy)',
                    border: member.isLocalPlayer ? '1px solid var(--hextech-cyan)' : '1px solid var(--border-dark)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={roleEmblem} alt={member.assignedPosition} style={{ width: '20px', height: '20px' }} />
                    <ChampionAvatar championName={member.championName || 'Unknown'} size="sm" variant={member.isLocalPlayer ? 'cyan' : 'gold'} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: member.isLocalPlayer ? 'var(--hextech-cyan)' : 'var(--text-primary)' }}>
                        {member.summonerName} {member.isLocalPlayer ? '(You)' : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
        <Card variant="danger">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-red)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
            <Swords size={18} /> Enemy Team
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {enemyList.map((member, idx) => {
              const roleEmblem = assetResolver.getRoleEmblem(member.assignedPosition || 'MID');

              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-glass-heavy)',
                    border: '1px solid var(--border-dark)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={roleEmblem} alt={member.assignedPosition} style={{ width: '20px', height: '20px' }} />
                    <ChampionAvatar championName={member.championName || 'Unknown'} size="sm" variant="danger" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {member.summonerName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {member.championName || 'Selecting...'}
                      </div>
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
