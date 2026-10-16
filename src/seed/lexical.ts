/** Dựng nội dung richText (Lexical) từ đoạn văn thường — chỉ dùng cho dữ liệu mẫu. */
type Node = Record<string, unknown>

const text = (t: string, bold = false): Node => ({ type: 'text', text: t, format: bold ? 1 : 0, detail: 0, mode: 'normal', style: '', version: 1 })

const paragraph = (t: string): Node => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
  children: [text(t)],
})

const heading = (t: string, tag: 'h2' | 'h3' = 'h2'): Node => ({ type: 'heading', tag, format: '', indent: 0, version: 1, direction: 'ltr', children: [text(t)] })

const list = (items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: items.map((it, i) => ({ type: 'listitem', value: i + 1, format: '', indent: 0, version: 1, direction: 'ltr', children: [text(it)] })),
})

/** Chuỗi bắt đầu bằng "## " là tiêu đề, "- " là gạch đầu dòng (liên tiếp gộp thành danh sách). */
export function rich(blocks: string[]) {
  const children: Node[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) children.push(list(bullets))
    bullets = []
  }
  for (const b of blocks) {
    if (b.startsWith('- ')) {
      bullets.push(b.slice(2))
      continue
    }
    flush()
    if (b.startsWith('### ')) children.push(heading(b.slice(4), 'h3'))
    else if (b.startsWith('## ')) children.push(heading(b.slice(3)))
    else children.push(paragraph(b))
  }
  flush()
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
}
