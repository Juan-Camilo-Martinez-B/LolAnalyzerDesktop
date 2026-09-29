import React from 'react';
import { Bot, CheckCircle2, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { useCoachAnalytics } from '../../hooks/useGameState';
import { Card, Badge, ProgressBar } from '../ui';
import { RadarChart, type RadarDataPoint } from '../ui/RadarChart';

export const CoachAnalyticsTab: React.FC = () => {
  const { analytics } = useCoachAnalytics();

  const complianceRate = analytics?.complianceRate ?? analytics?.overallComplianceRate ?? 78.4;
  const totalInterventions = analytics?.totalInterventions ?? analytics?.totalAdvicesGiven ?? 42;
  const focusAreas: string[] = analytics?.frequentMistakes ?? [
    'Rotaciones tardías a objetivos neutrales (Dragón/Barón) después del min 20.',
    'Overextending en línea lateral sin visión previa en la jungla enemiga.',
    'Falta de sincronización en tiempos de back antes de peleas de dragón.',
  ];

  const radarData: RadarDataPoint[] = [
    { axis: 'Fighting', value: 85, benchmarkValue: 70 },
    { axis: 'Farming', value: 78, benchmarkValue: 72 },
    { axis: 'Vision', value: 62, benchmarkValue: 75 },
    { axis: 'Objectives', value: 74, benchmarkValue: 68 },
    { axis: 'Survival', value: 80, benchmarkValue: 65 },
    { axis: 'Utility', value: 68, benchmarkValue: 60 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Coach Compliance & Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Compliance Score Card */}
        <Card variant="gold">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hextech-gold)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Bot size={16} /> AI Coach Compliance Rate
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--hextech-gold)', fontFamily: 'var(--font-heading)', marginTop: '4px' }}>
                {complianceRate.toFixed(1)}%
              </div>
            </div>
            <Badge variant="win">Optimal Learner</Badge>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Aceptaste <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>33 de {totalInterventions}</span> recomendaciones in-game.
          </div>
          <ProgressBar value={complianceRate} variant="gold" height={6} />
        </Card>

        {/* Tactical Recommendation Card */}
        <Card variant="cyan">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hextech-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px' }}>
            <Lightbulb size={18} /> Focus Strategic Goal
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--hextech-cyan)' }}>Objetivo de la Semana:</strong> Incrementar el marcador de visión en la jungla enemiga antes del minuto 15 para prevenir emboscadas.
          </p>
        </Card>
      </div>

      {/* Main Grid: Hextech Skill Radar & Recurring Focus Areas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Radar Chart Card */}
        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Target size={18} color="var(--hextech-cyan)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
              Skill Profile Radar
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <RadarChart data={radarData} size={280} showBenchmark={true} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.75rem', marginTop: '10px' }}>
            <span style={{ color: 'var(--hextech-cyan)', fontWeight: 600 }}>● Tus Métricas</span>
            <span style={{ color: 'var(--hextech-gold)', fontWeight: 600 }}>- - Rango Promedio</span>
          </div>
        </Card>

        {/* Frequent Mistakes & Drills */}
        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="var(--hextech-gold)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
              Recurring Areas to Improve
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {focusAreas.map((mistake: string, idx: number) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-glass-heavy)',
                  border: '1px solid var(--border-dark)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <CheckCircle2 size={16} color="var(--hextech-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{mistake}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
