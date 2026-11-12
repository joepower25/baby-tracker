"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={`mx-auto w-full max-w-md px-4 safe-top safe-bottom ${className}`}>
      {children}
    </main>
  );
}

export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="animate-rise">
      <p className="brand text-3xl font-semibold text-[var(--accent)]">Nestlog</p>
      {subtitle ? (
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 animate-rise">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-[var(--muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-[var(--accent)] text-white shadow-sm hover:brightness-105 active:scale-[0.98]",
    secondary:
      "bg-white/80 text-[var(--ink)] border border-[var(--line)] hover:bg-white active:scale-[0.98]",
    ghost: "bg-transparent text-[var(--ink-soft)] hover:bg-white/50",
    danger: "bg-[var(--danger)] text-white hover:brightness-105 active:scale-[0.98]",
  }[variant];
  return (
    <button
      className={`tap inline-flex items-center justify-center rounded-2xl px-4 text-base font-semibold transition disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[var(--ink-soft)]">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="tap w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 text-base outline-none ring-[var(--accent)] focus:ring-2"
      {...props}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      className="tap w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 text-base outline-none ring-[var(--accent)] focus:ring-2"
      {...props}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      className="min-h-24 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 py-3 text-base outline-none ring-[var(--accent)] focus:ring-2"
      {...props}
    />
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--accent)] text-white"
          : "bg-white/70 text-[var(--ink-soft)] border border-[var(--line)]"
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-[var(--radius)] px-5 py-8 text-center animate-rise">
      <p className="text-lg font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="animate-sheet relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] bg-[var(--card-strong)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[1.75rem]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)]"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`tap rounded-2xl border text-sm font-semibold transition ${
            value === opt.value
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--line)] bg-white/80 text-[var(--ink-soft)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
