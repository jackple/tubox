import { ToolLayout } from '@/components/layout/ToolLayout'
import { QrInspector } from './QrInspector'
import { QrStage } from './QrStage'

export default function QrCodePage() {
  return (
    <ToolLayout toolId="qrcode" inspector={<QrInspector />}>
      <QrStage />
    </ToolLayout>
  )
}
