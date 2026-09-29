import React from 'react';
import { Flame, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { Badge } from '../../components/ui';
import type { ObjectiveTimer } from '../../types/stats';

export interface ObjectiveTimersWidgetProps {
  timers?: ObjectiveTimer[];
  currentGameTimeSec?: number;
}

export const ObjectiveTimersWidget: React.FC<ObjectiveTimersWidgetProps> = ({
  timers,
  currentGameTimeSec = 872, // 14m 32s
}) => {
  const defaultTimers: ObjectiveTimer[] = [
    { type: 'dragon', spawnTimeSeconds: 940, isAlive: false, label: 'Infernal Dragon' }, // spawns in ~68s
    { type: 'baron', spawnTimeSeconds: 1200, isAlive: false, label: 'Baron Nashor' }, // spawns at 20m
    { type: 'void_grub', spawnTimeSeconds: 872, isAlive: true, label: 'Void Grubs' },
  ];

  const list = timers && timers.length > 0 ? timers : defaultTimers;

  return (
    <div
      style={{
        background: 'rgba(11, 14, 20, 0.92)',
        border: '1px solid var(--border-gold)',
        borderRadius: '8px',
        padding: '10px 14px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--hextech-gold)', textTransform: 'uppercase', marginBottom: '10px' }}>
        <Flame size={14} /> Neutral Objective Timers
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {list.map((obj, idx) => {
          const remainingSec = Math.max(0, obj.spawnTimeSeconds - currentGameTimeSec);
          const isSpawningSoon = !obj.isAlive && remainingSec <= 60;

          const remMin = Math.floor(remainingSec / 60);
          const remSec = remainingSec % 60;
          const formattedTimer = `${remMin}:${remSec.toString().padStart(2, '0')}`;

          return (
            <div
              key={idx}
              style={{
                background: isSpawningSoon ? 'rgba(200, 155, 60, 0.12)' : 'var(--bg-glass-heavy)',
                border: isSpawningSoon ? '1px solid var(--border-gold)' : '1px solid var(--border-dark)',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={14} color={obj.isAlive ? 'var(--accent-green)' : isSpawningSoon ? 'var(--hextech-gold)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {obj.label}
                </span>
              </div>

              {obj.isAlive ? (
                <Badge variant="win">ALIVE</Badge>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: isSpawningSoon ? 'var(--hextech-gold)' : 'var(--text-muted)' }}>
                  <Clock size={12} /> {formattedTimer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
