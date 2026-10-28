import { ToolLayout } from '@/components/layout/ToolLayout'
import { Badge } from '@/components/ui/controls'
import { useMessages } from '@/i18n'
import { useUpscale } from '@/stores/upscale'
import { UpscaleInspector } from './UpscaleInspector'
import { UpscaleStage } from './UpscaleStage'

export default function UpscalePage() {
  const done = useUpscale((s) => !!s.result && s.result.scale === s.scale && s.status === 'ready')
  const m = useMessages()
  return (
    <ToolLayout toolId="upscale" actions={done && <Badge tone="success">{m.upscale.done}</Badge>} inspector={<UpscaleInspector />}>
      <UpscaleStage />
    </ToolLayout>
  )
}
