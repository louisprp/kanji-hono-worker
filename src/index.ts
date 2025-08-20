import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'
import { parse, stringify, type Node } from 'svgson'
import { initWasm, Resvg } from '@resvg/resvg-wasm'

import wasmUrl from '@resvg/resvg-wasm/index_bg.wasm'
import notoSerif from '../NotoSerif-Regular.ttf'

type Env = {
  Bindings: { AUTH_TOKEN: string }
}

const PayloadSchema = v.object({
  chars: v.pipe(
    v.string(),
    v.custom<string>((s) => {
      const n = Array.from(s).length
      return n >= 1 && n <= 3
    }, 'chars must contain 1 to 3 characters')
  ),
})

await initWasm(wasmUrl)

const app = new Hono<Env>()

app.post(
  '/',
  bearerAuth({ verifyToken: (token, c) => token === c.env.AUTH_TOKEN }),
  vValidator('json', PayloadSchema),
  async (c) => {
    const { chars } = c.req.valid('json')

    // Fetch KanjiVG SVGs
    const glyphs = Array.from(chars)
    const base = 'https://cdn.statically.io/gh/KanjiVG/kanjivg/master/kanji'
    const files = glyphs.map((ch) =>
      ch.codePointAt(0)!.toString(16).padStart(5, '0') + '.svg'
    )

    const resps = await Promise.all(files.map((f) => fetch(`${base}/${f}`)))
    if (resps.some((r) => !r.ok)) {
      return c.json({ error: 'Not Found' }, 404)
    }

    const sources = await Promise.all(resps.map((r) => r.text()))
    const roots = await Promise.all(sources.map((s) => parse(s)))

    const unit = 109
    let offsetX = 0
    const glyphGroups: Node[] = []

    for (const root of roots) {
      const groups =
        (root.children ?? []).filter(
          (n) =>
            n.type === 'element' &&
            n.name === 'g' &&
            /^(kvg:StrokePaths_|kvg:StrokeNumbers_)/.test(n.attributes?.id ?? '')
        ) ?? []

      glyphGroups.push({
        type: 'element',
        name: 'g',
        value: '',
        attributes: { transform: `translate(${offsetX},0)` },
        children: groups,
      })

      offsetX += unit
    }

    const composed: Node = {
      type: 'element',
      name: 'svg',
      value: '',
      attributes: {
        xmlns: 'http://www.w3.org/2000/svg',
        'xmlns:kvg': 'http://kanjivg.tagaini.net',
        viewBox: `0 0 ${offsetX || unit} ${unit}`,
      },
      children: glyphGroups,
    }

    const outSvg = stringify(composed)
    const fitTo = { mode: 'width' as const, value: Math.max(512, (offsetX || unit) * 3) }

    const resvg = new Resvg(outSvg, {
      fitTo,
      font: {
        fontBuffers: [new Uint8Array(notoSerif)],
        defaultFontFamily: 'Noto Serif',
        loadSystemFonts: false,
      },
      background: 'white',
    })

    const png = resvg.render().asPng()

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png'
      },
    })
  }
)

export default app
