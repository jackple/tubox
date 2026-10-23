import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Dropzone } from '@/components/common/Dropzone'
import { Button } from '@/components/ui/Button'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { Field } from '@/components/ui/controls'
import { Segmented } from '@/components/ui/Segmented'
import { linear, paintToCss } from '@/core/scene/paint'
import type { Paint } from '@/core/scene/types'
import { errorMessage, useMessages } from '@/i18n'

export const bgPresets: Paint[] = [
  '#FFFFFF',
  '#111114',
  '#F5F0E8',
  '#EEF0F5',
  linear(135, '#FDE2E4', '#E2ECE9'),
  linear(135, '#A1C4FD', '#C2E9FB'),
  linear(135, '#FBC2EB', '#A6C1EE'),
  linear(135, '#FFECD2', '#FCB69F'),
]

const key = (p: Paint) => (typeof p === 'string' ? p.toLowerCase() : JSON.stringify(p))

export function BackgroundField({ value, onChange, label }: { value: Paint; onChange: (p: Paint) => void; label?: string }) {
  const m = useMessages()
  const active = bgPresets.find((p) => key(p) === key(value))
  return (
    <Field label={label ?? m.common.background}>
      <ColorSwatches
        size="sm"
        swatches={bgPresets.map((p) => ({ id: key(p), css: paintToCss(p) }))}
        value={active ? key(active) : null}
        onChange={(id) => onChange(bgPresets.find((p) => key(p) === id)!)}
        custom={{ value: typeof value === 'string' ? value : '#ffffff', active: !active, onChange }}
      />
    </Field>
  )
}

export type ExportType = 'image/jpeg' | 'image/png'

/** 检查器底栏：格式选择 + 导出按钮 */
export function ExportFooter({
  disabled,
  onExport,
  label,
  note,
}: {
  disabled?: boolean
  onExport: (type: ExportType) => Promise<void>
  label?: string
  note?: string
}) {
  const [type, setType] = useState<ExportType>('image/jpeg')
  const [busy, setBusy] = useState(false)
  const m = useMessages()
  return (
    <div className="space-y-2.5">
      {note && <p className="text-center text-[11px] text-muted">{note}</p>}
      <div className="flex gap-2">
        <Segmented<ExportType>
          size="sm"
          className="w-[116px]"
          value={type}
          onChange={setType}
          options={[
            { value: 'image/jpeg', label: 'JPG' },
            { value: 'image/png', label: 'PNG' },
          ]}
        />
        <Button
          variant="primary"
          className="flex-1"
          disabled={disabled}
          loading={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onExport(type)
            } catch (e) {
              toast.error(m.common.exportFailed, { description: errorMessage(e) })
            } finally {
              setBusy(false)
            }
          }}
        >
          {!busy && <Download className="h-4 w-4" />}
          {label ?? m.common.exportImage}
        </Button>
      </div>
    </div>
  )
}

export function EmptyStage({
  onFiles,
  title,
  hint,
  multiple = true,
}: {
  onFiles: (f: File[]) => void
  title: string
  hint: string
  multiple?: boolean
}) {
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <Dropzone onFiles={onFiles} multiple={multiple} className="aspect-[4/3] w-full max-w-[560px]" title={title} hint={hint} />
    </div>
  )
}

export const extOf = (t: ExportType) => (t === 'image/png' ? 'png' : 'jpg')
