import type { Widget, Anchor } from '@/web/overlay/widgets'

export const MECHANICS_TYPE = 'woke-mechanics'

export interface MechanicsWidget extends Widget {
  anchor: Anchor
  // Selected mechanic id.
  tab: string
  // Switch tabs when entering a mechanic's zone (Client.txt).
  autoSwitch: boolean
  // Mechanic ids hidden from the tab list.
  hidden: string[]
  // Starred Betrayal slots ("Member|divisionIndex").
  betrayalStars: string[]
  // User overrides of Betrayal reward text, by slot key.
  betrayalOverrides: Record<string, string>
}
