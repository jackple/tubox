import { ToolLayout } from '@/components/layout/ToolLayout'
import { Badge } from '@/components/ui/controls'
import { useMessages } from '@/i18n'
import { useCutout } from '@/stores/cutout'
import { CutoutInspector } from './CutoutInspector'
import { CutoutStage } from './CutoutStage'

export default function CutoutPage() {
  const status = useCutout((s) => s.status)
  const m = useMessages()
  return (
    <ToolLayout
      toolId="cutout"
      actions={status === 'done' && <Badge tone="success">{m.cutout.aiDone}</Badge>}
      inspector={<CutoutInspector />}
    >
      <CutoutStage />
    </ToolLayout>
  )
}
