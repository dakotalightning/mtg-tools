import { FC } from 'react'

export type IconName =
  | 'cloud' | 'search' | 'label' | 'token' | 'counter'
  | 'palette' | 'print' | 'leaf' | 'gem' | 'gear'

/**
 * Hidden SVG sprite. Rendered once near the root so `<use href="#name"/>`
 * references resolve. Icons are original line marks — no official MTG symbols.
 */
export const IconSprite: FC = () => (
  <svg style={{ display: 'none' }} aria-hidden="true">
    <defs>
      <symbol id="cloud" viewBox="0 0 24 24">
        <path d="M6 18h12a4 4 0 0 0 1-7.8A7 7 0 0 0 5.5 9 4.5 4.5 0 0 0 6 18Z" />
        <path d="m9 11 3-3 3 3M12 8v8" />
      </symbol>
      <symbol id="search" viewBox="0 0 24 24">
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </symbol>
      <symbol id="label" viewBox="0 0 24 24">
        <path d="M3 5h10l8 7-8 7H3Z" />
        <circle cx="7" cy="12" r="1" />
      </symbol>
      <symbol id="token" viewBox="0 0 24 24">
        <path d="M6 3h12v18H6Z" />
        <path d="m12 7 3 5-3 5-3-5Z" />
      </symbol>
      <symbol id="counter" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 9h5M9.5 6.5v5M14 16h4" />
      </symbol>
      <symbol id="palette" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <circle cx="8" cy="9" r="1" />
        <circle cx="13" cy="7" r="1" />
        <circle cx="17" cy="11" r="1" />
        <path d="M12 21c-4-4 5-4 2-7" />
      </symbol>
      <symbol id="print" viewBox="0 0 24 24">
        <path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6Z" />
      </symbol>
      <symbol id="leaf" viewBox="0 0 24 24">
        <path d="M5 18C1 7 13 3 21 3c0 12-7 19-16 15Zm0 0L17 7" />
      </symbol>
      <symbol id="gem" viewBox="0 0 24 24">
        <path d="m3 8 4-5h10l4 5-9 13Zm0 0h18M7 3l5 18 5-18" />
      </symbol>
      <symbol id="gear" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z" />
      </symbol>
    </defs>
  </svg>
)

const Icon: FC<{ name: IconName }> = ({ name }) => (
  <svg>
    <use href={`#${name}`} />
  </svg>
)

export default Icon
