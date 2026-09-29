import React, { useState, useEffect } from 'react';
import { AlertTriangle, HeartPulse, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { audioService } from '../../services/audioService';

export interface LiveTiltWarningProps {
  tiltIndex?: number;
  triggerReason?: string;
  adviceMessage?: string;
  onDismiss?: () => void;
}

export const LiveTiltWarning: React.FC<LiveTiltWarningProps> = ({
  tiltIndex = 78,
  triggerReason = '2 muertes consecutivas en 3 minutos',
  adviceMessage = 'Mantén la calma. Evita forzar peleas 1v1 sin visión. Enfócate en asegurar 2 oleadas de súbditos bajo torre.',
  onDismiss,
}) => {
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathTimer, setBreathTimer] = useState(10);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    audioService.playWarning();
  }, []);

  // Guided breathing countdown timer
  useEffect(() => {
    if (!showBreathing) return;

    const interval = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowBreathing(false);
          if (onDismiss) onDismiss();
          return 10;
        }

        const remaining = prev - 1;
        if (remaining >= 7) setBreathPhase('Inhale');
        else if (remaining >= 4) setBreathPhase('Hold');
        else setBreathPhase('Exhale');

        return remaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showBreathing, onDismiss]);

  const handleStartBreathing = () => {
    setShowBreathing(true);
    setBreathTimer(10);
    setBreathPhase('Inhale');
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255, 70, 85, 0.22) 0%, rgba(11, 14, 20, 0.95) 100%)',
        border: '1px solid var(--accent-red)',
        borderRadius: '8px',
        padding: '12px 14px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(255, 70, 85, 0.3)',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {!showBreathing ? (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <AlertTriangle size={16} /> TILT ALERT: Level {tiltIndex}/100
            </div>
            <button
              onClick={onDismiss}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Trigger Reason */}
          <div style={{ fontSize: '0.72rem', color: 'var(--hextech-gold)', fontWeight: 700, marginBottom: '6px' }}>
            Causa: {triggerReason}
          </div>

          {/* Advice Text */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4, margin: '0 0 10px 0' }}>
            {adviceMessage}
          </p>

          {/* Action Button: Breathe & Reset */}
          <button
            onClick={handleStartBreathing}
            style={{
              width: '100%',
              background: 'var(--hextech-gold)',
              color: 'var(--hextech-black)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 10px rgba(200, 155, 60, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <HeartPulse size={14} /> 10s Breathing Reset Exercise
          </button>
        </div>
      ) : (
        /* Breathing Guided Exercise Overlay */
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ color: 'var(--hextech-gold)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '6px' }}>
            Mindset Reset • {breathPhase} ({breathTimer}s)
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(200, 155, 60, 0.4) 0%, rgba(0,0,0,0) 70%)',
                border: '2px solid var(--hextech-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--hextech-gold)',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            >
              {breathTimer}
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Inhala despacio... exhala la frustración. Mantén el foco en la victoria.
          </div>
        </div>
      )}
    </div>
  );
};
