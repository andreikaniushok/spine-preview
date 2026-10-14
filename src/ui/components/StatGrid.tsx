import type { ReactNode } from "react";

export interface StatItem {
  label: ReactNode;
  value: ReactNode;
  /** Span full width of the grid */
  wide?: boolean;
}

export interface StatGridProps {
  items: readonly StatItem[];
  className?: string;
}

export function StatGrid({ items, className = "" }: StatGridProps) {
  const classes = ["ui-stat-grid", className].filter(Boolean).join(" ");
  return (
    <dl className={classes}>
      {items.map((item, index) => (
        <div key={index} className={item.wide ? "ui-stat-wide" : undefined}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
