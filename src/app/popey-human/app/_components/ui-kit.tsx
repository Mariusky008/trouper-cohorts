import type { ReactNode } from "react";

export const uiKit = {
  pageWrap: "mx-auto w-full max-w-5xl space-y-5",
  pageWrapNarrow: "mx-auto w-full max-w-4xl space-y-5",
  glassCard: "rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl",
  card: "rounded-2xl border border-white/15 bg-black/25",
  modal: "w-full rounded-3xl border border-white/20 bg-[#101A38] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.9)]",
  backButton: "h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-black/25 text-white/90 transition hover:border-cyan-300/45",
  primaryButton:
    "h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-300 text-[#10263A] text-sm font-black uppercase tracking-wide transition hover:brightness-105",
  warningButton:
    "h-11 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-300 text-[#2E240E] text-sm font-black uppercase tracking-wide transition hover:brightness-105",
  subtleButton:
    "h-10 rounded-xl border border-white/20 bg-black/25 text-xs font-black uppercase tracking-wide text-white/90 transition hover:border-cyan-300/45",
};

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: CardProps) {
  return <div className={`${uiKit.glassCard} ${className}`.trim()}>{children}</div>;
}

export function ModalCard({ children, className = "" }: CardProps) {
  return <div className={`${uiKit.modal} ${className}`.trim()}>{children}</div>;
}
