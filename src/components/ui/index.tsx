// ============================================================
// LolAnalyzer - Reusable UI Components
// src/components/ui/index.tsx
// ============================================================

import './ui.css';
import { type ReactNode, type CSSProperties } from 'react';
import { TrendingUp, TrendingDown, Minus as MinusIcon } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────────── */
type CardVariant = 'default' | 'gold' | 'cyan' | 'danger' | 'flat';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: CSSProperties;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  onClick?: () => void;
  id?: string;
}

export function Card({
  children, variant = 'default', className = '', style, title, subtitle, headerRight, onClick, id,
}: CardProps) {
  const variantClass = variant !== 'default' ? `card--${variant}` : '';
  return (
    <div
      id={id}
      className={`card ${variantClass} ${className}`}
      style={{ ...style, cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {(title || headerRight) && (
        <div className="card__header">
          <div>
            {title && <div className="card__title">{title}</div>}
            {subtitle && <div className="card__subtitle">{subtitle}</div>}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BADGE
───────────────────────────────────────────────────────── */
type BadgeVariant = 'win' | 'loss' | 'gold' | 'cyan' | 'neutral' | 'danger'
  | 'iron' | 'bronze' | 'silver' | 'platinum' | 'emerald' | 'diamond'
  | 'master' | 'grandmaster' | 'challenger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'neutral', icon, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant.toLowerCase()} ${className}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/** Convenience tier badge */
export function TierBadge({ tier, division }: { tier: string; division?: string }) {
  const t = tier.toLowerCase();
  const showDiv = division && !['master', 'grandmaster', 'challenger'].includes(t);
  return (
    <Badge variant={t as BadgeVariant} className="badge--tier">
      {tier}{showDiv ? ` ${division}` : ''}
    </Badge>
  );
}

/* ─────────────────────────────────────────────────────────
   TOOLTIP
───────────────────────────────────────────────────────── */
type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  placement?: TooltipPlacement;
}

export function Tooltip({ children, content, placement = 'top' }: TooltipProps) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className={`tooltip-content tooltip-content--${placement}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT METRIC
───────────────────────────────────────────────────────── */
type MetricColor = 'default' | 'gold' | 'cyan' | 'green' | 'red';
type DeltaDir   = 'up' | 'down' | 'flat';

interface StatMetricProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: MetricColor;
  delta?: number;        // positive = up, negative = down
  deltaLabel?: string;
  tooltip?: string;
}

export function StatMetric({ label, value, sub, color = 'default', delta, deltaLabel, tooltip }: StatMetricProps) {
  const colorClass = color !== 'default' ? `stat-metric__value--${color}` : '';
  let dir: DeltaDir = 'flat';
  if (delta !== undefined) dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  const inner = (
    <div className="stat-metric">
      <span className="stat-metric__label">{label}</span>
      <span className={`stat-metric__value ${colorClass}`}>{value}</span>
      {(sub || delta !== undefined) && (
        <span className="stat-metric__sub">
          {sub}
          {delta !== undefined && (
            <span className={`stat-metric__delta stat-metric__delta--${dir}`}>
              {dir === 'up' && <TrendingUp size={10} />}
              {dir === 'down' && <TrendingDown size={10} />}
              {dir === 'flat' && <MinusIcon size={10} />}
              {deltaLabel ?? (delta > 0 ? `+${delta}` : delta)}
            </span>
          )}
        </span>
      )}
    </div>
  );

  if (tooltip) return <Tooltip content={tooltip}>{inner}</Tooltip>;
  return inner;
}

/* ─────────────────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────────────────── */
type ProgressVariant = 'gold' | 'cyan' | 'green' | 'red';

interface ProgressBarProps {
  value: number;      // 0-100
  variant?: ProgressVariant;
  height?: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ value, variant, height = 4, className = '', label }: ProgressBarProps) {
  const fillClass = variant ? `progress-bar__fill--${variant}` : '';
  const clampedVal = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`progress-bar ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clampedVal}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`progress-bar__fill ${fillClass}`}
        style={{ width: `${clampedVal}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────────────────── */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = size !== 'md' ? `spinner--${size}` : '';
  return <span className={`spinner ${sizeClass} ${className}`} aria-label="Loading" role="status" />;
}

/* ─────────────────────────────────────────────────────────
   DIVIDER
───────────────────────────────────────────────────────── */
export function GoldDivider({ className = '' }: { className?: string }) {
  return <div className={`divider-gold ${className}`} role="separator" />;
}

export function SurfaceDivider({ className = '' }: { className?: string }) {
  return <div className={`divider-surface ${className}`} role="separator" />;
}
