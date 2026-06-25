/**
 * Prahari AI Design Tokens
 * Enforces a professional, calm, but high-urgency light theme.
 * No purple gradients, no neon glassmorphism.
 */

export const DESIGN_TOKENS = {
  colors: {
    // Primary background and canvas elements
    background: {
      base: "bg-slate-50",        // Light neutral background
      card: "bg-white",           // Card backings
      alt: "bg-slate-100",        // Secondary background segments
    },
    // Main textual and typography values
    text: {
      primary: "text-slate-900",  // Crisp high-contrast reading text
      secondary: "text-slate-600",// Meta/subtext
      tertiary: "text-slate-400", // Muted placeholders/borders
    },
    // The "Calm Urgent" brand palette
    brand: {
      primary: "bg-slate-900 hover:bg-slate-800 text-white", // Dark structural primary
      primaryText: "text-slate-900",
      accent: "text-amber-600",    // Calming warning tone
      accentBg: "bg-amber-50 border-amber-200 text-amber-900",
    },
    // Diagnostic urgency levels
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
    }
  },
  typography: {
    fontSans: "font-sans",
    fontMono: "font-mono",
    headings: "font-sans font-semibold tracking-tight text-slate-900",
  },
  shadows: {
    sm: "shadow-xs",
    md: "shadow-sm",
    lg: "shadow-md border border-slate-100",
  },
  radius: {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
  }
};
