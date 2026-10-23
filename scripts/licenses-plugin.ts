import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/** 第三方许可证清单的发布路径（站点根目录下） */
export const LICENSES_FILE = 'third-party-licenses.txt'

/** 不经 npm 打包、运行时由站点分发的模型 */
const MODELS = [
  'ISNet / DIS (https://github.com/xuebinqin/DIS) — 抠图模型 background removal model, via @imgly/background-removal-data',
  'MediaPipe selfie_multiclass_256x256 / blaze_face_short_range (https://ai.google.dev/edge/mediapipe) — Apache-2.0',
]

/** 包内未附带许可证文件、package.json 的 author 也不是版权方时，手动指定 */
const COPYRIGHT: Record<string, string> = {
  'onnxruntime-web': 'Microsoft Corporation',
  'onnxruntime-common': 'Microsoft Corporation',
}

interface Entry {
  id: string
  license: string
  text: string
  /** 包内附带的第三方声明（如 @imgly 的 ThirdPartyLicenses.json，其依赖已预打包进 dist） */
  notices: string[]
}

/**
 * 构建时汇总打包进产物的所有 npm 依赖（含 Worker 中的依赖，以及它们的直接依赖——部分包的 dist 已内联依赖）的许可证全文，
 * 输出到 dist/third-party-licenses.txt，满足 MIT / Apache 等许可证「随分发附带许可声明」的要求。
 * 主包与 Worker 包分别构建，共用同一个收集表；Worker 先于主包产出。
 */
export function licensesPlugin(): { main: Plugin; worker: Plugin } {
  /** 包目录（…/node_modules/<name>/），以目录去重 */
  const dirs = new Set<string>()

  const addDir = (dir: string) => {
    if (dirs.has(dir) || !existsSync(join(dir, 'package.json'))) return
    dirs.add(dir)
    // pnpm 把依赖放在包所在 node_modules 的同级目录
    const root = dir.replace(/(?:@[^/]+\/)?[^/]+\/$/, '')
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    for (const dep of Object.keys(pkg.dependencies ?? {})) addDir(`${root}${dep}/`)
  }

  const collect = (bundle: Record<string, { type: string; modules?: Record<string, unknown> }>) => {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk' || !chunk.modules) continue
      for (const id of Object.keys(chunk.modules)) {
        // pnpm 路径形如 node_modules/.pnpm/x@1/node_modules/@scope/name/...，取最后一段 node_modules
        const m = id.replace(/\\/g, '/').match(/^(.*\/node_modules\/(?:@[^/]+\/)?[^/]+\/)/)
        if (m) addDir(m[1])
      }
    }
  }

  const read = (dir: string): Entry => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const files = readdirSync(dir)
    const file = files.find((f) => /^(licen[cs]e|copying)(\.(md|markdown|txt))?$/i.test(f))
    let license: string = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'UNKNOWN')
    if (/^SEE LICENSE/i.test(license) && file && /Affero General Public License/.test(readFileSync(join(dir, file), 'utf8')))
      license = 'AGPL-3.0'
    const notices: string[] = []
    if (files.includes('ThirdPartyLicenses.json')) {
      const list: Record<string, { source?: string; license?: string; type?: string }> = JSON.parse(
        readFileSync(join(dir, 'ThirdPartyLicenses.json'), 'utf8'),
      )
      for (const [name, v] of Object.entries(list))
        notices.push(`${name} (${v.type ?? 'code'}, ${v.license ?? 'UNKNOWN'}) ${v.source ?? ''}`.trim())
    }
    return { id: `${pkg.name}@${pkg.version}`, license, text: file ? readFileSync(join(dir, file), 'utf8').trim() : '', notices }
  }

  /** 包内未附带许可证文件时补全：MIT 按模板写入版权方，Apache-2.0 等通用文本借用同许可证的其它包 */
  const fillMissing = (entries: Entry[], dirOf: Map<string, string>) => {
    for (const e of entries) {
      if (e.text) continue
      const body = e.license === 'MIT' ? MIT_BODY : e.license === 'ISC' ? ISC_BODY : null
      if (body) {
        const pkg = JSON.parse(readFileSync(join(dirOf.get(e.id)!, 'package.json'), 'utf8'))
        const author = COPYRIGHT[pkg.name] ?? (typeof pkg.author === 'string' ? pkg.author : (pkg.author?.name ?? `${pkg.name} authors`))
        e.text = `${e.license} License\n\nCopyright (c) ${author}\n\n${body}`
      } else {
        e.text =
          entries.find((x) => x.text && x.license === e.license && !/copyright \(c\)/i.test(x.text.slice(0, 300)))?.text ??
          `License: ${e.license}`
      }
    }
  }

  const worker: Plugin = {
    name: 'tubox-licenses-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      collect(bundle)
    },
  }

  const main: Plugin = {
    name: 'tubox-licenses',
    apply: 'build',
    generateBundle(_, bundle) {
      collect(bundle)
      const dirOf = new Map<string, string>()
      const entries = [...dirs]
        .map((dir) => {
          const e = read(dir)
          dirOf.set(e.id, dir)
          return e
        })
        // 同一个包可能在 pnpm 中解析到多个目录
        .filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i)
        .sort((a, b) => a.id.localeCompare(b.id))
      fillMissing(entries, dirOf)

      const rule = '='.repeat(80)
      const source = [
        'Tubox 使用的第三方开源软件及其许可证。Tubox 本身以 AGPL-3.0 许可发布。',
        'Third-party open source software used by Tubox, and their licenses. Tubox itself is licensed under AGPL-3.0.',
        '',
        ...entries.map((e) => `- ${e.id} (${e.license})`),
        '',
        'Models distributed with this site:',
        ...MODELS.map((x) => `- ${x}`),
        '',
        ...entries.flatMap((e) => [
          rule,
          `${e.id} — ${e.license}`,
          rule,
          '',
          e.text,
          ...(e.notices.length ? ['', 'Bundled third-party components:', ...e.notices.map((n) => `- ${n}`)] : []),
          '',
        ]),
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: LICENSES_FILE, source })
    },
  }

  return { main, worker }
}

const ISC_BODY = `Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`

const MIT_BODY = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`
