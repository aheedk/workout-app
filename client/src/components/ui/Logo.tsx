/** App brand name — change here to rename everywhere. */
export const APP_NAME = 'LIFT';

/**
 * Barbell logo mark. Drawn with currentColor so it inherits whatever text
 * color it's given (we use the accent), guaranteeing contrast against the
 * page in every palette and in both light and dark — no background plate
 * that could swallow the glyph.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      {/* center bar */}
      <rect x="9" y="14.5" width="14" height="3" />
      {/* inner plates */}
      <rect x="6" y="9" width="3" height="14" />
      <rect x="23" y="9" width="3" height="14" />
      {/* outer plates */}
      <rect x="3" y="12" width="2.5" height="8" />
      <rect x="26.5" y="12" width="2.5" height="8" />
      {/* end caps */}
      <rect x="1" y="13.5" width="1.6" height="5" />
      <rect x="29.4" y="13.5" width="1.6" height="5" />
    </svg>
  );
}
