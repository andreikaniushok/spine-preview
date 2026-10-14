import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const classes = ["ui-btn", `ui-btn-${variant}`, className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
