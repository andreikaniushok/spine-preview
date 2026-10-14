export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const classes = ["ui-progress", className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="status" aria-live="polite" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="ui-progress-track">
        <div className="ui-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {label ? <span className="ui-progress-label">{label}</span> : null}
    </div>
  );
}
