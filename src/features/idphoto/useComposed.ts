import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useIdPhoto } from '@/stores/idphoto'

/** 订阅影响成片的所有状态，返回合成后的证件照画布 */
export function useComposed() {
  const deps = useIdPhoto(useShallow((s) => [s.source, s.person, s.framing, s.adjust, s.bg, s.removeBg, s.specId, s.customPx]))
  return useMemo(() => useIdPhoto.getState().render(), deps)
}
