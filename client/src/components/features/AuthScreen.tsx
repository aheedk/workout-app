import React from 'react';

/** Shared input + label styling for the auth forms. */
export const fieldClass =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';

export const labelClass = 'eyebrow mb-1.5 block';

export const fieldErrorClass = 'mt-1.5 text-xs font-medium text-red-600 dark:text-red-400';

interface AuthScreenProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
      <div className="grain-overlay" aria-hidden />

      {/* Giant atmospheric backdrop word. */}
      <span
        className="pointer-events-none select-none absolute -right-10 bottom-[-4rem] font-display text-[34vw] leading-none uppercase text-gray-900/[0.035] dark:text-white/[0.035]"
        aria-hidden
      >
        Iron
      </span>

      <div className="relative z-10 w-full max-w-md animate-plate-in">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center bg-gray-900 dark:bg-gray-50">
            <span className="font-display text-2xl leading-none text-blue-500 -mt-0.5">L</span>
          </span>
          <span className="eyebrow">Iron Ledger</span>
        </div>

        <div className="relative plate p-8">
          <span className="absolute inset-x-0 top-0 h-[3px] bg-blue-500" aria-hidden />
          <h1 className="font-display text-4xl uppercase leading-none tracking-wide text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>

          <div className="mt-7">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">{footer}</p>
      </div>
    </div>
  );
}

interface SubmitButtonProps {
  pending: boolean;
  pendingLabel: string;
  label: string;
}

export function SubmitButton({ pending, pendingLabel, label }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold uppercase tracking-label py-3 transition-colors"
    >
      {pending ? pendingLabel : label}
      {!pending && (
        <span className="transition-transform group-hover:translate-x-1" aria-hidden>
          →
        </span>
      )}
    </button>
  );
}
