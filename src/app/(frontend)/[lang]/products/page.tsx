import StaticPage, { generateMetadata as staticMetadata } from '../[slug]/page'

type Params = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

const withSlug = (p: Params) => ({ params: p.params.then((x) => ({ ...x, slug: 'products' })), searchParams: p.searchParams })

export const generateMetadata = (p: Params) => staticMetadata(withSlug(p))

export default function ProductsPage(p: Params) {
  return StaticPage(withSlug(p))
}
