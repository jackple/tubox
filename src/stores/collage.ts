import { create, type StoreApi } from 'zustand'
import { toast } from 'sonner'
import { type GridOptions, defaultGridOptions } from '@/core/collage/grid'
import { type LongImageOptions, defaultLongImageOptions } from '@/core/collage/longImage'
import { type NineGridOptions, defaultNineGridOptions } from '@/core/collage/nineGrid'
import type { SocialContent } from '@/core/collage/social'
import type { FontKind } from '@/core/fonts'
import { type ImageAsset, disposeAsset, loadAssets } from '@/lib/assets'

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
      if (room <= 0) return void toast.warning(`最多添加 ${max} 张图片`)
      const { ok, failed } = await loadAssets(files.slice(0, room))
      if (failed) toast.error(`${failed} 张图片无法读取`)
      if (files.length > room) toast.warning(`已达上限，仅添加前 ${room} 张`)
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
    content: { title: '周末去海边\n吹吹风', subtitle: '一份超详细的城市漫游攻略，收藏起来慢慢看', tag: '旅行日记', footer: '@图盒' },
  },
  patch: (p) => set((s) => ({ options: { ...s.options, ...p } })),
  setContent: (p) => set((s) => ({ options: { ...s.options, content: { ...s.options.content, ...p } } })),
}))
