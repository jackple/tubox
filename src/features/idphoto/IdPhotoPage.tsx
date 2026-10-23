import { ToolLayout } from '@/components/layout/ToolLayout'
import { Badge } from '@/components/ui/controls'
import { useMessages } from '@/i18n'
import { useIdPhoto } from '@/stores/idphoto'
import { IdInspector } from './IdInspector'
import { IdStage } from './IdStage'
import { SpecPicker } from './SpecPicker'

export default function IdPhotoPage() {
  const status = useIdPhoto((s) => s.status)
  const m = useMessages()
  return (
    <ToolLayout
      toolId="idphoto"
      actions={status === 'done' && <Badge tone="success">{m.idphoto.aiDone}</Badge>}
      left={<SpecPicker />}
      inspector={<IdInspector />}
    >
      <IdStage />
    </ToolLayout>
  )
}
