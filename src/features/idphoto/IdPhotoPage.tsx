import { ToolLayout } from '@/components/layout/ToolLayout'
import { Badge } from '@/components/ui/controls'
import { useIdPhoto } from '@/stores/idphoto'
import { IdInspector } from './IdInspector'
import { IdStage } from './IdStage'
import { SpecPicker } from './SpecPicker'

export default function IdPhotoPage() {
  const status = useIdPhoto((s) => s.status)
  return (
    <ToolLayout
      toolId="idphoto"
      actions={status === 'done' && <Badge tone="success">AI 处理完成</Badge>}
      left={<SpecPicker />}
      inspector={<IdInspector />}
    >
      <IdStage />
    </ToolLayout>
  )
}
