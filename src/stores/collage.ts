import { create, type StoreApi } from 'zustand'
import { toast } from 'sonner'
import { type GridOptions, defaultGridOptions } from '@/core/collage/grid'
import { type LongImageOptions, defaultLongImageOptions } from '@/core/collage/longImage'
import { type NineGridOptions, defaultNineGridOptions } from '@/core/collage/nineGrid'
import type { SocialContent } from '@/core/collage/social'
import type { FontKind } from '@/core/fonts'
import { fmt, getMessages, plural } from '@/i18n'
import { type ImageAsset, disposeAsset, loadAssets } from '@/lib/assets'
import { useLocale } from './locale'

/* 每个拼图工具一个独立 store，切换页面时状态保留 */

export interface AssetList {
  images: ImageAsset[]
  add: (files: File[]) => Promise<void>
  remove: (id: string) => void
  move: (from: number, to: number) => void
  clear: () => void
}

function assetList<T extends AssetList>(set: StoreApi<T>['setState'], get: StoreApi<T>['getState'], max = 60): AssetList {
  return {
    images: [],
    add: async (files) => {
      const room = max - get().images.length
      const m = getMessages().assets
      if (room <= 0) return void toast.warning(fmt(m.max, { max }))
      const { ok, failed } = await loadAssets(files.slice(0, room))
      if (failed) toast.error(plural(m.unreadable, failed))
      if (files.length > room) toast.warning(plural(m.truncated, room))
      set({ images: [...get().images, ...ok] } as Partial<T>)
    },
    remove: (id) => {
      const it = get().images.find((i) => i.id === id)
      if (it) disposeAsset(it)
      set({ images: get().images.filter((i) => i.id !== id) } as Partial<T>)
    },
    move: (from, to) => {
      const images = [...get().images]
      const [it] = images.splice(from, 1)
      images.splice(to, 0, it)
      set({ images } as Partial<T>)
    },
    clear: () => {
      get().images.forEach(disposeAsset)
      set({ images: [] as ImageAsset[] } as Partial<T>)
    },
  }
}

type WithOptions<O> = AssetList & { options: O; patch: (p: Partial<O>) => void }

export const useLongImage = create<WithOptions<LongImageOptions>>((set, get) => ({
  ...assetList(set, get, 80),
  options: defaultLongImageOptions,
  patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
}))

export const useGrid = create<WithOptions<GridOptions>>((set, get) => ({
  ...assetList(set, get, 9),
  options: defaultGridOptions,
  patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
}))

export const useNineGrid = create<WithOptions<NineGridOptions>>((set, get) => ({
  ...assetList(set, get, 1),
  options: defaultNineGridOptions,
  patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
}))

export interface SocialOptions {
  presetId: string
  styleId: string
  themeId: string
  font: FontKind
  content: SocialContent
}

export const useSocial = create<WithOptions<SocialOptions> & { setContent: (p: Partial<SocialContent>) => void }>((set, get) => ({
  ...assetList(set, get, 4),
  options: {
    presetId: 'xhs',
    styleId: 'cover',
    themeId: 'cream',
    font: 'sans',
    content: { ...getMessages().social.sample },
  },
  patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
  setContent: (p) => set((s) => ({ options: { ...s.options, content: { ...s.options.content, ...p } } })),
}))

// 切换语言时，若示例文案未被修改，则换成新语言的示例
useLocale.subscribe((s, prev) => {
  if (!s.messages || !prev.messages || s.messages === prev.messages) return
  const content = useSocial.getState().options.content
  const old = prev.messages.social.sample
  if ((Object.keys(old) as (keyof SocialContent)[]).every((k) => content[k] === old[k]))
    useSocial.getState().setContent(s.messages.social.sample)
})
