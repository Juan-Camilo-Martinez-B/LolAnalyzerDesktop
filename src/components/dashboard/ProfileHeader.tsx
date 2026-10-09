import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Shield, Award } from 'lucide-react';
import { useGameState } from '../../hooks/useGameState';
import { useAuth } from '../../context/AuthContext';
import { assetResolver, ensureDdragonVersion } from '../../services/assetResolver';
import { TierBadge, Badge } from '../ui';
import { audioService } from '../../services/audioService';

export const ProfileHeader: React.FC = () => {
  const { summoner, rankInfo, connectionStatus, refreshState } = useGameState();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iconVersion, setIconVersion] = useState(assetResolver.getVersion());

  useEffect(() => {
    let active = true;
    ensureDdragonVersion().then(() => {
      if (active) setIconVersion(assetResolver.getVersion());
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    audioService.playClick();
    setIsRefreshing(true);
    await refreshState();
    setTimeout(() => {
      setIsRefreshing(false);
      audioService.playSuccess();
    }, 600);
  };

  const linkedName = user?.riotLinked && user.riotGameName
    ? `${user.riotGameName}#${user.riotTagLine ?? ''}`
    : '';
  const name = summoner?.gameName
    ? `${summoner.gameName}#${summoner.tagLine || user?.riotTagLine || ''}`
    : summoner?.displayName || linkedName || 'Sin Riot ID';

  const level = summoner?.summonerLevel && summoner.summonerLevel > 0 ? summoner.summonerLevel : null;
  const profileIconId = summoner?.profileIconId ?? user?.summonerIconId ?? 29;
  const iconUrl = assetResolver.getProfileIcon(profileIconId, iconVersion);

  const tier = rankInfo?.tier || '';
  const division = rankInfo?.division || '';
  const lp = rankInfo?.leaguePoints ?? 0;
  const wins = rankInfo?.wins ?? 0;
  const losses = rankInfo?.losses ?? 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : null;
  const rankEmblemUrl = tier ? assetResolver.getRankEmblem(tier) : '';

  return (
    <div className="profile-header-card">
      <div className="profile-identity">
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
              onError={(event) => {
                const img = event.currentTarget;
                if (img.dataset.fallback === '1') return;
                img.dataset.fallback = '1';
                img.src = `https://raw.communitydragon.org/latest/game/assets/ux/summonericons/profileicon${profileIconId}.png`;
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
            {level ? `Lvl ${level}` : 'Lvl —'}
          </div>
        </div>

        <div className="profile-identity__text">
          <div className="profile-identity__name-row">
            <h2 className="profile-identity__name">
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

          <div className="profile-meta">
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

      <div className="profile-rank">
        {/* Rank Badge Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {rankEmblemUrl && (
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
          )}

          <div>
            {tier ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TierBadge tier={tier} division={division} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--hextech-gold)' }}>
                    {lp} LP
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{wins}W</span>{' '}
                  <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{losses}L</span>{' '}
                  {winRate && (
                    <span style={{ color: 'var(--hextech-cyan)', fontWeight: 700, marginLeft: '4px' }}>
                      ({winRate}% WR)
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {linkedName ? 'Sin clasificar' : 'Vincula tu Riot ID en Ajustes'}
              </div>
            )}
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
