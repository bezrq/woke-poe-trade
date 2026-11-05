// The item tooltip for any screen: put v-item-tip on a row or name.
//
//   <div v-item-tip="{ name: m.name, type: m.type, variant: m.variant }">
//
// `type` is the poe.ninja row type; leave it out and it's worked out from the
// name. The text loads from public/data/tips on the first hover.
import type { ObjectDirective } from 'vue'
import { ITEM_BY_REF } from '@/assets/data'
import { usePoeninja } from '@/web/background/Prices'
import { buildTip, kindOfNinjaType, packFiles } from './tip-content'
import type { TipKind, TipModel, TipPack } from './tip-content'
import { hideTip, onTipHide, showTipAt } from './tooltip'
import type { TipMarket } from './tooltip'

export interface ItemTipRef {
  name: string
  type?: string
  variant?: string
}

const SHOW_DELAY_MS = 60

const pack: TipPack = {}
const loading = new Map<keyof TipPack, Promise<void>>()

function loadFile (file: keyof TipPack): Promise<void> {
  let job = loading.get(file)
  if (!job) {
    job = fetch(`${import.meta.env.BASE_URL}data/tips/${file}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then(data => { pack[file] = data })
      // Leaves the file out so the next hover tries again.
      .catch(() => { loading.delete(file) })
    loading.set(file, job)
  }
  return job
}

export function kindOfName (name: string): TipKind {
  if (name.startsWith('Foulborn ') || ITEM_BY_REF('UNIQUE', name)?.length) return 'unique'
  if (ITEM_BY_REF('GEM', name)?.length) return 'gem'
  if (ITEM_BY_REF('DIVINATION_CARD', name)?.length) return 'card'
  return 'item'
}

const NINJA_NS: Record<TipKind, string> = { unique: 'UNIQUE', gem: 'GEM', card: 'DIVINATION_CARD', item: 'ITEM' }

function marketFor (ref: ItemTipRef, kind: TipKind): TipMarket | null {
  const ninja = usePoeninja()
  ninja.queuePricesFetch()
  const ns = ref.type === 'Beast' ? 'CAPTURED_BEAST' : NINJA_NS[kind]
  const info = ninja.findPriceByQuery({ ns, name: ref.name, variant: ref.variant || undefined }) ??
    (ref.variant ? null : ninja.findPriceByName(ns, ref.name))
  if (!info) return null
  const graph = (info.graph ?? []).filter((v): v is number => v != null)
  return {
    chaos: info.chaos,
    divine: ninja.xchgRate.value ?? null,
    variant: ref.variant ? undefined : info.variant,
    // The last point is the % change over the whole line.
    change: graph.length ? graph[graph.length - 1] / 100 : null,
    graph
  }
}

async function tipFor (ref: ItemTipRef): Promise<{ model: TipModel | null, market: TipMarket | null }> {
  const kind = ref.type ? kindOfNinjaType(ref.type) : kindOfName(ref.name)
  await Promise.all(packFiles(kind).map(loadFile))
  const base = kind === 'unique' ? ITEM_BY_REF('UNIQUE', ref.name)?.[0]?.unique?.base : undefined
  const model = buildTip(pack, { name: ref.name, kind, variant: ref.variant, base })
  return { model, market: marketFor(ref, kind) }
}

// ---- hover ----

let seq = 0
let timer: ReturnType<typeof setTimeout> | undefined
let hovered: HTMLElement | null = null
const refs = new WeakMap<HTMLElement, ItemTipRef | null | undefined>()

function cancel () {
  seq++
  clearTimeout(timer)
}
onTipHide(cancel)

function leave () {
  hovered = null
  hideTip()
}

function enter (e: Event) {
  const el = e.currentTarget as HTMLElement
  const ref = refs.get(el)
  hovered = el
  if (!ref?.name) { hideTip(); return }
  cancel()
  const mine = seq
  timer = setTimeout(() => {
    tipFor(ref).then(({ model, market }) => {
      if (mine !== seq || !el.isConnected) return
      if (model) showTipAt(el, { kind: 'lookup', model, market })
      // No text for it, but a price is still worth showing.
      else if (market) showTipAt(el, { kind: 'lookup', model: { name: ref.name, frame: 'normal', sections: [] }, market })
      else hideTip()
    }).catch(() => { if (mine === seq) hideTip() })
  }, SHOW_DELAY_MS)
}

export const vItemTip: ObjectDirective<HTMLElement, ItemTipRef | null | undefined> = {
  mounted (el, binding) {
    refs.set(el, binding.value)
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    // The right-click menu opens where the tooltip would be in the way.
    el.addEventListener('contextmenu', leave)
  },
  updated (el, binding) {
    const before = refs.get(el)
    const after = binding.value
    refs.set(el, after)
    // A list re-sorted under the pointer now has a different item here.
    if (hovered === el && (before?.name !== after?.name || before?.variant !== after?.variant)) leave()
  },
  beforeUnmount (el) {
    el.removeEventListener('mouseenter', enter)
    el.removeEventListener('mouseleave', leave)
    el.removeEventListener('contextmenu', leave)
    if (hovered === el) leave()
  }
}
