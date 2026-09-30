/**
 * Shared Tailwind class strings for the primitives that repeat across the
 * workshop (buttons, eyebrow/sub/code text, panels, headings). Structural
 * layout classes stay inline in each component. `cx` joins truthy fragments.
 */
export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

const BTN_BASE =
  'cursor-pointer min-h-[44px] border rounded-md px-4 py-[9px] font-semibold ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#3980ad] focus-visible:outline-offset-[3px]'

/** Default (paper) button. */
export const BTN = cx(BTN_BASE, 'border-line bg-paper text-ink hover:border-brass hover:bg-[#f5ede0]')

/** Primary (midnight ink) button. */
export const BTN_PRIMARY = cx(BTN_BASE, 'bg-night text-white border-night hover:border-brass')

/** Section eyebrow (small uppercase brass label). */
export const EYEBROW = 'text-[11px] font-bold tracking-[2px] text-[#806033] uppercase mb-[5px]'

/** Muted sub-heading paragraph. */
export const SUB = 'text-[15px] text-muted'

/** Inline monospace identifier/badge. */
export const CODE = 'font-mono text-xs bg-[#e9e7e0] px-1.5 py-[3px] rounded-[3px]'

/** Editorial serif page title. */
export const H1 =
  'font-serif font-normal text-[34px] leading-[1.2] tracking-[-.8px] mb-2 max-[760px]:text-[29px]'

/** Section heading (sans). */
export const H2 = 'text-xl leading-snug mb-2 font-semibold'

/** Sub-section heading (sans). */
export const H3 = 'text-base font-semibold'

/** Paper card/panel surface. */
export const PANEL = 'bg-paper border border-line rounded-lg p-[22px]'

/** Page header row (title block + optional action). */
export const PAGE_HEAD =
  'flex justify-between items-center gap-6 mb-6 max-[760px]:items-start max-[760px]:gap-3'

/** Bottom call-to-action strip. */
export const NOTE_BOX =
  'mt-5 bg-[#eae6dc] border border-[#dcd5c7] rounded-lg p-4 flex justify-between items-center gap-[14px] max-[760px]:items-start max-[760px]:flex-col'
