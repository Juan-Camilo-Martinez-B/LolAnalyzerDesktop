import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Activity, Award, X } from 'lucide-react';
import { Modal, Badge, ProgressBar } from '../ui';
import { TelemetryTimelineChart } from './TelemetryTimelineChart';
import { ChampionAvatar } from '../common/ChampionAvatar';
import { useMatchTelemetry } from '../../hooks/useGameState';
import type { MatchTelemetry } from '../../types/stats';

export interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string | null;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  isOpen,
  onClose,
  matchId,
}) => {
  const { fetchTelemetry } = useMatchTelemetry();
  const [telemetry, setTelemetry] = useState<MatchTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && matchId) {
      setLoading(true);
      fetchTelemetry(matchId).then((data) => {
        setTelemetry(data);
        setLoading(false);
      });
    }
  }, [isOpen, matchId, fetchTelemetry]);

  if (!isOpen) return null;

  // Mock match telemetry if backend detail is pending
  const isWin = telemetry?.isWin ?? true;
  const championName = telemetry?.championName ?? 'Ahri';
  const kills = telemetry?.kills ?? 11;
  const deaths = telemetry?.deaths ?? 2;
  const assists = telemetry?.assists ?? 9;
  const durationMin = 28;
  const durationSec = 44;

  const coachInsights = telemetry?.aiCoachInsights ?? [
    'Dominio absoluto en fase de líneas: Mantuviste una ventaja de +1,250 de oro al minuto 15.',
    'Gran rotación a Heraldo y Dragón: Participación en el 75% de los objetivos neutrales del equipo.',
    'Sugerencia de mejora: Se colocaron solo 8 centinelas de visión; busca comprar más Wards de Control en mid-game.',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="var(--hextech-gold)" />
          <span>Match Analysis & Telemetry Drilldown</span>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Section */}
        <div
          style={{
            background: isWin
              ? 'linear-gradient(135deg, rgba(10, 200, 185, 0.15) 0%, rgba(11, 14, 20, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 70, 85, 0.15) 0%, rgba(11, 14, 20, 0.95) 100%)',
            border: `1px solid ${isWin ? 'var(--hextech-cyan)' : 'var(--accent-red)'}`,
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ChampionAvatar championName={championName} size="lg" variant={isWin ? 'cyan' : 'danger'} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Badge variant={isWin ? 'win' : 'loss'} icon={isWin ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}>
                  {isWin ? 'VICTORY' : 'DEFEAT'}
                </Badge>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {durationMin}m {durationSec}s • Ranked Solo/Duo
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {championName}
              </h2>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-green)' }}>{kills}</span> /{' '}
              <span style={{ color: 'var(--accent-red)' }}>{deaths}</span> /{' '}
              <span style={{ color: 'var(--hextech-cyan)' }}>{assists}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--hextech-gold)', fontWeight: 700, marginTop: '2px' }}>
              {deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : kills + assists} KDA
            </div>
          </div>
        </div>

        {/* Telemetry Gold Curve Section */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--hextech-gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Team Gold Difference Timeline (+ / - Gold)
          </div>
          <div style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '12px' }}>
            <TelemetryTimelineChart telemetry={telemetry?.timeline ?? []} />
          </div>
        </div>

        {/* AI Coach Insights Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(200, 155, 60, 0.08) 0%, rgba(11, 14, 20, 0.95) 100%)',
            border: '1px solid var(--border-gold)',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hextech-gold)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
            <Sparkles size={16} /> AI Coach Post-Match Diagnosis
          </div>

          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {coachInsights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};
