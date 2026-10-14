import type { ReactNode } from "react";

export interface FieldRowProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FieldRow({ label, children, className = "", htmlFor }: FieldRowProps) {
  const classes = ["ui-field-row", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
