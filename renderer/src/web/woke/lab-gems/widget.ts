import type { Widget, Anchor } from '@/web/overlay/widgets'
import type { GemState, SpecificMode } from './font'

export const LAB_GEMS_TYPE = 'woke-lab-gems'

export interface LabGemsWidget extends Widget {
  anchor: Anchor
  view: 'color' | 'specific'
  gemState: GemState
  specificMode: SpecificMode
  topN: number
  minProfit: number
}
