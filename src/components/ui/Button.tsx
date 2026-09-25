import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "min-h-12 bg-cm-red text-white hover:bg-cm-red-light border border-transparent shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
  secondary:
    "min-h-12 bg-transparent text-white border border-cm-divider hover:border-cm-gray hover:bg-white/[0.04]",
  ghost: "min-h-12 bg-transparent text-cm-gray hover:text-white border border-transparent",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[4px] px-6 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[4px] px-6 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
