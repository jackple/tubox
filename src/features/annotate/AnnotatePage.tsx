import { ToolLayout } from '@/components/layout/ToolLayout'
import { AnnotateInspector } from './AnnotateInspector'
import { AnnotateStage } from './AnnotateStage'

export default function AnnotatePage() {
  return (
    <ToolLayout toolId="annotate" inspector={<AnnotateInspector />}>
      <AnnotateStage />
    </ToolLayout>
  )
}
