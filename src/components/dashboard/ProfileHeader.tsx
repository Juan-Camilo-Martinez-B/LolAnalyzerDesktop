import React, { useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Shield, Award } from 'lucide-react';
import { useGameState } from '../../hooks/useGameState';
import { assetResolver } from '../../services/assetResolver';
import { TierBadge, Badge } from '../ui';
import { audioService } from '../../services/audioService';

export const ProfileHeader: React.FC = () => {
  const { summoner, rankInfo, connectionStatus, refreshState } = useGameState();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    audioService.playClick();
    setIsRefreshing(true);
    await refreshState();
    setTimeout(() => {
      setIsRefreshing(false);
      audioService.playSuccess();
    }, 600);
  };

  const name = summoner?.gameName
    ? `${summoner.gameName}#${summoner.tagLine || 'LAN'}`
    : summoner?.displayName || 'Summoner';

  const level = summoner?.summonerLevel || 30;
  const profileIconId = summoner?.profileIconId || 1;
  const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${assetResolver.getVersion()}/img/profileicon/${profileIconId}.png`;

  const tier = rankInfo?.tier || 'GOLD';
  const division = rankInfo?.division || 'I';
  const lp = rankInfo?.leaguePoints ?? 75;
  const wins = rankInfo?.wins ?? 84;
  const losses = rankInfo?.losses ?? 62;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '50.0';

  const rankEmblemUrl = assetResolver.getRankEmblem(tier);

  return (
    <div
      className="profile-header-card"
      style={{
        background: 'linear-gradient(135deg, rgba(16, 26, 42, 0.85) 0%, rgba(10, 14, 23, 0.95) 100%)',
        border: '1px solid var(--border-gold)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(200, 155, 60, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        gap: '20px',
      }}
    >
      {/* Hextech Background Glow Accent */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(10, 200, 185, 0.08) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left Section: Avatar + Name + Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
        {/* Profile Icon with Level Badge */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(135deg, var(--hextech-gold) 0%, var(--hextech-black) 100%)',
              boxShadow: '0 0 12px rgba(200, 155, 60, 0.4)',
            }}
          >
            <img
              src={iconUrl}
              alt="Profile Icon"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/0.png';
              }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </div>
          {/* Level Pill */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-glass-heavy)',
              border: '1px solid var(--border-gold)',
              borderRadius: '10px',
              padding: '1px 8px',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--hextech-gold)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            Lvl {level}
          </div>
        </div>

        {/* Summoner Name & Status */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              {name}
            </h2>

            {/* Connection Status Pill */}
            <Badge
              variant={connectionStatus === 'connected' ? 'cyan' : 'neutral'}
              icon={connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            >
              {connectionStatus === 'connected' ? 'LCU Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '6px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} color="var(--hextech-cyan)" /> Solo/Duo Ranked
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={13} color="var(--hextech-gold)" /> Season 2026
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Ranked Emblem & Winrate Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 1 }}>
        {/* Rank Badge Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src={rankEmblemUrl}
            alt={tier}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            style={{
              width: '64px',
              height: '64px',
              filter: 'drop-shadow(0 0 10px rgba(200, 155, 60, 0.4))',
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TierBadge tier={tier} division={division} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--hextech-gold)' }}>
                {lp} LP
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{wins}W</span>{' '}
              <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{losses}L</span>{' '}
              <span style={{ color: 'var(--hextech-cyan)', fontWeight: 700, marginLeft: '4px' }}>
                ({winRate}% WR)
              </span>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh Summoner Stats"
          style={{
            background: 'var(--bg-glass-medium)',
            border: '1px solid var(--border-gold)',
            color: 'var(--hextech-gold)',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          className="btn-refresh"
        >
          <RefreshCw
            size={18}
            style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>
    </div>
  );
};
