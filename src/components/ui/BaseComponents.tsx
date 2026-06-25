import React from "react";
import { ArrowRight } from "lucide-react";

// =========================================================================
// BUTTON COMPONENT
// =========================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xs transition-all duration-200 cursor-pointer focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-200",
    outline: "border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 focus:ring-2 focus:ring-slate-200",
    destructive: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4.5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

// =========================================================================
// CARD COMPONENT
// =========================================================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  padded = true,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-sm shadow-xs transition-all duration-300 ${
        hoverEffect ? "hover:border-slate-300 hover:shadow-sm" : ""
      } ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// =========================================================================
// BADGE COMPONENT
// =========================================================================
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  urgency?: "low" | "medium" | "high" | "critical" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  urgency = "neutral",
  className = "",
  ...props
}) => {
  const styles = {
    low: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border border-amber-200",
    high: "bg-rose-50 text-rose-800 border border-rose-200",
    critical: "bg-red-100 text-red-900 border border-red-300 font-semibold",
    neutral: "bg-slate-100 text-slate-800 border border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono tracking-wide font-medium uppercase shrink-0 ${styles[urgency]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// =========================================================================
// INPUT FIELD COMPONENT
// =========================================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-sm text-sm focus:outline-hidden transition-all duration-200 ${
          error ? "border-rose-400 focus:border-rose-600" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

// =========================================================================
// TEXTAREA FIELD COMPONENT
// =========================================================================
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  id,
  className = "",
  rows = 4,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-sm text-sm focus:outline-hidden transition-all duration-200 resize-none ${
          error ? "border-rose-400 focus:border-rose-600" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

// =========================================================================
// SECTION HEADER COMPONENT
// =========================================================================
interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  className = "",
  ...props
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150 ${className}`} {...props}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
