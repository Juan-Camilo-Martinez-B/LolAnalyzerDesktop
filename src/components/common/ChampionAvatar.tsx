import React, { useState } from 'react';
import { assetResolver } from '../../services/assetResolver';

export interface ChampionAvatarProps {
  championName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'cyan' | 'danger' | 'neutral';
  masteryLevel?: number;
  level?: number;
  className?: string;
  showBorder?: boolean;
}

export const ChampionAvatar: React.FC<ChampionAvatarProps> = ({
  championName,
  size = 'md',
  variant = 'gold',
  masteryLevel,
  level,
  className = '',
  showBorder = true,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => assetResolver.getChampionSquare(championName));

  const sizePixels = {
    sm: 36,
    md: 48,
    lg: 64,
    xl: 80,
  }[size];

  const borderColors = {
    gold: 'var(--border-gold)',
    cyan: 'var(--hextech-cyan)',
    danger: 'var(--accent-red)',
    neutral: 'var(--border-dark)',
  }[variant];

  const handleImgError = () => {
    setImgSrc('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png');
  };

  return (
    <div
      className={`champion-avatar-wrapper ${className}`}
      style={{
        position: 'relative',
        width: sizePixels,
        height: sizePixels,
        display: 'inline-block',
      }}
    >
      <img
        src={imgSrc}
        alt={championName || 'Champion'}
        onError={handleImgError}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          objectFit: 'cover',
          border: showBorder ? `2px solid ${borderColors}` : 'none',
          boxShadow: showBorder ? `0 0 8px ${borderColors}` : 'none',
          backgroundColor: 'var(--bg-glass-heavy)',
        }}
      />

      {/* Mastery Badge Overlay */}
      {masteryLevel !== undefined && masteryLevel > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            background: 'var(--hextech-black)',
            border: '1px solid var(--hextech-gold)',
            color: 'var(--hextech-gold)',
            borderRadius: '50%',
            width: size === 'sm' ? '14px' : '18px',
            height: size === 'sm' ? '14px' : '18px',
            fontSize: size === 'sm' ? '0.6rem' : '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
          title={`Mastery Level ${masteryLevel}`}
        >
          {masteryLevel}
        </div>
      )}

      {/* Champion In-game Level Overlay */}
      {level !== undefined && level > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '2px',
            background: 'rgba(0, 0, 0, 0.75)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            padding: '1px 3px',
            fontSize: '0.65rem',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {level}
        </div>
      )}
    </div>
  );
};
