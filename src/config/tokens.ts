/**
 * Prahari AI Design Tokens
 * Calm, high-trust, action-oriented light theme.
 * Built for deadline rescue workflows — not generic admin dashboards.
 */

export const DESIGN_TOKENS = {
  colors: {
    background: {
      base: "bg-[#f9f8f5]",
      card: "bg-[#f3f0ec]",
      alt: "bg-[#efeae3]",
      subtle: "bg-[#f6f3ee]",
    },
    text: {
      primary: "text-[#28251d]",
      secondary: "text-[#7a7974]",
      tertiary: "text-[#a19d96]",
      inverse: "text-[#f9f8f5]",
    },
    border: {
      soft: "border-[#28251d]/10",
      medium: "border-[#28251d]/14",
      strong: "border-[#28251d]/20",
    },
    brand: {
      primary: "bg-[#01696f] hover:bg-[#005156] text-white",
      primaryText: "text-[#01696f]",
      primarySoft: "bg-[#01696f]/10 text-[#01696f] border border-[#01696f]/15",
      accent: "text-[#d97706]",
      accentBg: "bg-amber-50 text-amber-900 border border-amber-200",
    },
    urgency: {
      low: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-800",
      },
      medium: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-800",
      },
      high: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        badge: "bg-rose-100 text-rose-800",
      },
      critical: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        badge: "bg-red-100 text-red-900",
      },
    },
  },
  typography: {
    fontSans: "font-sans",
    fontMono: "font-mono",
    fontSerif: "font-serif",
    headings: "font-sans font-semibold tracking-tight text-[#28251d]",
    display: "font-serif tracking-tight text-[#28251d]",
    body: "font-sans text-[#28251d]",
    meta: "font-sans text-[#7a7974]",
  },
  shadows: {
    sm: "shadow-[0_2px_8px_rgba(40,37,29,0.04)]",
    md: "shadow-[0_8px_24px_rgba(40,37,29,0.06)]",
    lg: "shadow-[0_14px_34px_rgba(40,37,29,0.08)]",
  },
  radius: {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
  },
  transitions: {
    standard: "transition-all duration-200 ease-out",
    slow: "transition-all duration-300 ease-out",
  },
};