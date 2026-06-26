import React from "react";

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
  const baseStyle =
    "inline-flex items-center justify-center rounded-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";

  const variants = {
    primary:
      "bg-[#01696f] hover:bg-[#005156] text-white shadow-sm focus:ring-2 focus:ring-[#01696f]/20 focus:ring-offset-2",
    secondary:
      "bg-[#f3f0ec] hover:bg-[#ebe7e1] text-[#28251d] border border-[#28251d]/10 focus:ring-2 focus:ring-[#28251d]/10",
    outline:
      "bg-transparent border border-[#28251d]/14 hover:border-[#28251d]/28 hover:bg-[#f3f0ec]/70 text-[#28251d] focus:ring-2 focus:ring-[#28251d]/10",
    destructive:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-2 focus:ring-rose-500/20 focus:ring-offset-2",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
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
      className={`bg-[#f3f0ec] border border-[#28251d]/10 rounded-sm transition-all duration-200 ${
        hoverEffect ? "hover:border-[#28251d]/18 hover:shadow-sm" : ""
      } ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

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
    critical: "bg-red-100 text-red-900 border border-red-300",
    neutral: "bg-[#f9f8f5] text-[#5f5b53] border border-[#28251d]/10",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[11px] font-medium shrink-0 ${styles[urgency]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

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
        <label htmlFor={id} className="block text-xs font-medium text-[#7a7974]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3.5 py-2.5 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/22 focus:border-[#01696f] rounded-sm text-sm text-[#28251d] placeholder:text-[#7a7974]/55 focus:outline-none transition-all duration-200 ${
          error ? "border-rose-400 focus:border-rose-600" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

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
        <label htmlFor={id} className="block text-xs font-medium text-[#7a7974]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full px-3.5 py-2.5 bg-[#f9f8f5] border border-[#28251d]/12 hover:border-[#28251d]/22 focus:border-[#01696f] rounded-sm text-sm text-[#28251d] placeholder:text-[#7a7974]/55 focus:outline-none transition-all duration-200 resize-none ${
          error ? "border-rose-400 focus:border-rose-600" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

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
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#28251d]/10 ${className}`}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[#28251d] tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[#7a7974]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};