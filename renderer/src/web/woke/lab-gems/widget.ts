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
  // Leave thin-market gems out of the EVs, profits and lists.
  skipThin?: boolean
  // Runner mode: count the lab entry, the gem you insert and your run time.
  runner?: boolean
  runnerLab?: 'merciless' | 'eternal'
  runnerGemCost?: number
  runnerMinutes?: number
}
