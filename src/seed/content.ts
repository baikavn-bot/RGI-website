/**
 * Nội dung mẫu cho bản chạy thử. Chữ trên website là bản nháp để Quản lý marketing và Pháp chế duyệt;
 * mọi số liệu chưa có nguồn đều để "Đang cập nhật" (spec_status = proposed).
 * Không có giá, không có nhãn Hợp quy, không ghi PT Dunia Plast Indonesia là nhà sản xuất, không dùng ®.
 */
import { FACTORY_RECYCLING_STATEMENT } from '../lib/constants'

type L<T = string> = { vi: T; en: T }

export const SETTINGS = {
  companyName: {
    vi: 'Công ty TNHH Renvindo Greenplast International',
    en: 'Renvindo Greenplast International Company Limited',
  },
  taxCode: '0319717793',
  address: {
    vi: 'F9, Diamond Plaza, 34 Lê Duẩn, Phường Sài Gòn, TP. Hồ Chí Minh',
    en: 'F9, Diamond Plaza, 34 Le Duan Street, Sai Gon Ward, Ho Chi Minh City',
  },
  representative: 'Nguyễn Thị Xuân Mai — Giám đốc',
  hotline: '0948 391 202',
  email: 'greenplast.renco689@gmail.com',
  // [CẦN XÁC NHẬN] cam kết thời gian phản hồi — để trống tới khi Giám đốc chốt
  responseTime: { vi: '', en: '' },
  consentText: {
    vi: 'Tôi đồng ý để RGI xử lý thông tin trên nhằm liên hệ, tư vấn và gửi tài liệu về sản phẩm RENCO, theo',
    en: 'I agree that RGI may process the information above to contact me, advise me and send RENCO product documents, under the',
  },
}

export const IMAGES: { key: string; file: string; alt: L; source: string }[] = [
  { key: 'factoryLine', file: 'RGI_factory_int1.jpg', alt: { vi: 'Dây chuyền ép đùn ống mềm trong nhà máy REN Group', en: 'Hose extrusion lines at the REN Group factory' }, source: 'Bộ ảnh RGI_Brand_Assets — nhà máy REN Group' },
  { key: 'factoryHall', file: 'RGI_factory_int3.jpg', alt: { vi: 'Xưởng sản xuất và khu xếp hàng thành phẩm', en: 'Production hall and finished-goods area' }, source: 'Bộ ảnh RGI_Brand_Assets — nhà máy REN Group' },
  { key: 'factoryStore', file: 'RGI_factory_int4.jpg', alt: { vi: 'Kho nguyên liệu và lối đi trong nhà máy', en: 'Material store and aisle inside the factory' }, source: 'Bộ ảnh RGI_Brand_Assets — nhà máy REN Group' },
  { key: 'factoryOutside', file: 'RGI_factory_ext.jpg', alt: { vi: 'Nhà máy REN Group tại Tangerang, Indonesia', en: 'REN Group factory in Tangerang, Indonesia' }, source: 'Bộ ảnh RGI_Brand_Assets — nhà máy REN Group' },
  { key: 'flakes', file: 'RGI_flakes_hand.jpg', alt: { vi: 'Mảnh nhựa tái chế trên tay công nhân', en: 'Recycled plastic flakes in a worker’s hand' }, source: 'Bộ ảnh RGI_Brand_Assets — nhà máy REN Group' },
  { key: 'bottles', file: 'RGI_waste_bottles.jpg', alt: { vi: 'Chai nhựa thu gom trước khi tái chế', en: 'Collected plastic bottles before recycling' }, source: 'Bộ ảnh RGI_Brand_Assets' },
  { key: 'hoseGroup', file: 'RGI_hose_group_rc.jpg', alt: { vi: 'Các cuộn ống mềm PVC RENCO nhiều màu', en: 'Coils of RENCO PVC hoses in several colours' }, source: 'Bộ ảnh RGI_Brand_Assets — ảnh đã thay nhãn RENCO' },
  { key: 'hoseBraided', file: 'RGI_hose_benang_prima_rc.jpg', alt: { vi: 'Cuộn ống mềm PVC lưới dệt RENCO', en: 'Coils of RENCO braided PVC hose' }, source: 'Bộ ảnh RGI_Brand_Assets — ảnh đã thay nhãn RENCO' },
  { key: 'hoseCompressor', file: 'RGI_hose_kompresor_rc.jpg', alt: { vi: 'Ống mềm PVC lưới dệt màu vàng dùng cho máy nén khí', en: 'Yellow braided PVC hose for air compressors' }, source: 'Bộ ảnh RGI_Brand_Assets — ảnh đã thay nhãn RENCO' },
  { key: 'hoseSpiral', file: 'RGI_hose_cover_spiral_rc.jpg', alt: { vi: 'Ống mềm PVC gân xoắn màu xanh', en: 'Blue spiral-reinforced PVC hose' }, source: 'Bộ ảnh RGI_Brand_Assets — ảnh đã thay nhãn RENCO' },
  { key: 'hoseClear', file: 'RGI_hose_bening.jpg', alt: { vi: 'Cuộn ống mềm PVC trong suốt', en: 'Coils of clear PVC hose' }, source: 'Bộ ảnh RGI_Brand_Assets' },
  { key: 'hoseDuct', file: 'RGI_hose_duct.jpg', alt: { vi: 'Ống gân xoắn màu trắng', en: 'White spiral duct hose' }, source: 'Bộ ảnh RGI_Brand_Assets' },
  { key: 'roofing', file: 'RENCO_roofing_recycled.png', alt: { vi: 'Tấm lợp nhựa tái chế ép, bề mặt vân nhiều màu', en: 'Pressed recycled-plastic roofing sheet with multicolour texture' }, source: 'Ảnh sản phẩm RGI cung cấp' },
  { key: 'wallboard', file: 'RENCO_wallboard_recycled.png', alt: { vi: 'Tấm ốp tường nhựa tái chế, mỗi tấm một vân', en: 'Recycled-plastic wall panel, each with its own pattern' }, source: 'Ảnh sản phẩm RGI cung cấp' },
]

export type LineSeed = { code: string; color: string; order: number; name: L; slug: L; tagline: L; description: L; image?: string; note?: L }

export const LINES: LineSeed[] = [
  {
    code: 'RC-P',
    color: '#1846D6',
    order: 1,
    name: { vi: 'Ống uPVC', en: 'uPVC pipes' },
    slug: { vi: 'ong-upvc', en: 'upvc-pipes' },
    tagline: { vi: 'Ống cứng uPVC hệ inch.', en: 'Inch-series rigid uPVC pipes.' },
    description: {
      vi: 'Tám cỡ phổ thông từ Ø21 đến Ø114. Thông số và phạm vi sử dụng công bố cùng hồ sơ hợp quy.',
      en: 'Eight common sizes from Ø21 to Ø114. Specifications and scope of use will be published with the conformity declaration.',
    },
    note: {
      vi: 'Ống uPVC sẽ mở bán sau khi RGI hoàn tất công bố hợp quy. Anh/chị đăng ký trước để nhận thông báo đầu tiên.',
      en: 'uPVC pipes go on sale once RGI completes its conformity declaration. Register now to hear first.',
    },
  },
  {
    code: 'RC-H',
    color: '#EF8307',
    order: 2,
    name: { vi: 'Ống mềm PVC', en: 'PVC hoses' },
    slug: { vi: 'ong-mem-pvc', en: 'pvc-hoses' },
    tagline: { vi: '13 dòng ống mềm, từ ống tưới vườn tới ống hút gân xoắn.', en: '13 hose lines, from garden hose to spiral suction hose.' },
    description: {
      vi: 'Ống dẫn nước, ống trong suốt, ống lưới dệt chịu áp và ống kỹ thuật cho nông nghiệp, xưởng, công trình.',
      en: 'Water hose, clear hose, braided pressure hose and technical hose for farms, workshops and sites.',
    },
    image: 'hoseGroup',
  },
  {
    code: 'RC-S',
    color: '#00A354',
    order: 3,
    name: { vi: 'Tấm nhựa tái chế', en: 'Recycled plastic boards' },
    slug: { vi: 'tam-nhua-tai-che', en: 'recycled-plastic-boards' },
    tagline: { vi: 'Khổ chuẩn 1220 × 2440 mm.', en: 'Standard size 1220 × 2440 mm.' },
    description: {
      vi: 'Tấm nhựa ép từ nhựa tái chế. Chủng loại, chiều dày và công dụng đang chờ nhà máy xác nhận.',
      en: 'Boards pressed from recycled plastic. Types, thickness and uses are awaiting factory confirmation.',
    },
  },
  {
    code: 'RC-R',
    color: '#E3261F',
    order: 4,
    name: { vi: 'Tấm lợp nhựa tái chế', en: 'Recycled plastic roofing' },
    slug: { vi: 'tam-lop', en: 'roofing-sheets' },
    tagline: { vi: 'Mỗi tấm một vân. Ba chiều dài theo khuôn 1800, 2100, 2400 mm.', en: 'Every sheet has its own pattern. Three mould lengths: 1800, 2100, 2400 mm.' },
    description: {
      vi: 'Tấm lợp ép từ nhựa tái chế. Thông số khổ hữu dụng, chiều dày, khối lượng đang chờ nhà máy xác nhận.',
      en: 'Roofing pressed from recycled plastic. Effective width, thickness and weight are awaiting factory confirmation.',
    },
    image: 'roofing',
  },
  {
    code: 'RC-W',
    color: '#6B7D73',
    order: 5,
    name: { vi: 'Tấm ốp tường', en: 'Wall panels' },
    slug: { vi: 'tam-op-tuong', en: 'wall-panels' },
    tagline: { vi: 'Mỗi tấm một vẻ. Khổ 1220 × 2440 mm.', en: 'Each panel looks different. 1220 × 2440 mm.' },
    description: {
      vi: 'Tấm ốp tường từ nhựa tái chế, bề mặt vân mảnh nhựa nhiều màu.',
      en: 'Wall panels made from recycled plastic with a multicolour flake surface.',
    },
    image: 'wallboard',
  },
]

type VariantSeed = { sku: string; size: L; values?: Record<string, number> }
export type ProductSeed = {
  code: string
  line: string
  order: number
  name: L
  slug: L
  summary: L
  uses?: L<string[]>
  standardText?: L
  saleStatus: 'coming_soon' | 'on_sale'
  claimLevel: 'none' | 'level1_factory'
  cover?: string
  images?: string[]
  variants: VariantSeed[]
  body?: L<string[]>
}

const inch = (s: string) => ({ vi: s, en: s })

export const PRODUCTS: ProductSeed[] = [
  {
    code: 'RC-P',
    line: 'RC-P',
    order: 1,
    name: { vi: 'Ống uPVC hệ inch', en: 'uPVC pipe, inch series' },
    slug: { vi: 'ong-upvc-he-inch', en: 'upvc-pipe-inch-series' },
    summary: {
      vi: 'Ống cứng uPVC hệ inch, tám cỡ từ Ø21 đến Ø114. Thông số đang chờ nhà máy xác nhận.',
      en: 'Rigid uPVC pipe, inch series, eight sizes from Ø21 to Ø114. Specifications awaiting factory confirmation.',
    },
    standardText: { vi: 'TCCS 01:2026/RGI (dự thảo)', en: 'TCCS 01:2026/RGI (draft)' },
    saleStatus: 'coming_soon',
    claimLevel: 'none',
    variants: [
      // Số liệu là quy cách đề xuất, chưa phải số nhà máy → để proposed, website hiện "Đang cập nhật".
      { sku: 'RC-P21', size: inch('Ø21'), values: { dnMm: 21, eMm: 1.6, pnBar: 15, lengthM: 4 } },
      { sku: 'RC-P27', size: inch('Ø27'), values: { dnMm: 27, eMm: 1.8, pnBar: 14, lengthM: 4 } },
      { sku: 'RC-P34', size: inch('Ø34'), values: { dnMm: 34, eMm: 2.0, pnBar: 12, lengthM: 4 } },
      { sku: 'RC-P42', size: inch('Ø42'), values: { dnMm: 42, eMm: 2.1, pnBar: 9, lengthM: 4 } },
      { sku: 'RC-P49', size: inch('Ø49'), values: { dnMm: 49, eMm: 2.4, pnBar: 9, lengthM: 4 } },
      { sku: 'RC-P60', size: inch('Ø60'), values: { dnMm: 60, eMm: 2.8, pnBar: 9, lengthM: 4 } },
      { sku: 'RC-P90', size: inch('Ø90'), values: { dnMm: 90, eMm: 3.8, pnBar: 9, lengthM: 4 } },
      { sku: 'RC-P114', size: inch('Ø114'), values: { dnMm: 114, eMm: 4.9, pnBar: 9, lengthM: 4 } },
    ],
  },
  {
    code: 'RC-H-W',
    line: 'RC-H',
    order: 1,
    name: { vi: 'Ống mềm PVC dẫn nước', en: 'PVC water hose' },
    slug: { vi: 'ong-mem-dan-nuoc', en: 'water-hose' },
    summary: {
      vi: 'Nhóm RC-H01 – H05. Ống mềm dẫn nước, cuộn theo mét, nhiều màu.',
      en: 'Group RC-H01 – H05. Flexible water hose in coils, several colours.',
    },
    saleStatus: 'on_sale',
    claimLevel: 'level1_factory',
    cover: 'hoseGroup',
    variants: [
      { sku: 'RC-H01-1/2', size: inch('1/2"') },
      { sku: 'RC-H01-5/8', size: inch('5/8"') },
      { sku: 'RC-H01-3/4', size: inch('3/4"') },
    ],
  },
  {
    code: 'RC-H-C',
    line: 'RC-H',
    order: 2,
    name: { vi: 'Ống mềm PVC trong suốt', en: 'Clear PVC hose' },
    slug: { vi: 'ong-mem-trong-suot', en: 'clear-hose' },
    summary: {
      vi: 'Nhóm RC-H06 – H07. Ống trong, nhìn được dòng chảy bên trong.',
      en: 'Group RC-H06 – H07. Transparent hose that shows the flow inside.',
    },
    saleStatus: 'on_sale',
    claimLevel: 'level1_factory',
    cover: 'hoseClear',
    variants: [
      { sku: 'RC-H06-3/16', size: inch('3/16"') },
      { sku: 'RC-H06-1/4', size: inch('1/4"') },
      { sku: 'RC-H06-3/8', size: inch('3/8"') },
      { sku: 'RC-H07-1/2', size: inch('1/2"') },
    ],
  },
  {
    code: 'RC-H-B',
    line: 'RC-H',
    order: 3,
    name: { vi: 'Ống mềm PVC lưới dệt', en: 'Braided PVC hose' },
    slug: { vi: 'ong-mem-luoi-det', en: 'braided-hose' },
    summary: {
      vi: 'Nhóm RC-H08 – H09. Có lớp lưới sợi bên trong, chịu áp tốt hơn ống trơn.',
      en: 'Group RC-H08 – H09. Fibre braid inside for higher pressure than plain hose.',
    },
    saleStatus: 'on_sale',
    claimLevel: 'level1_factory',
    cover: 'hoseBraided',
    images: ['hoseCompressor'],
    variants: [
      { sku: 'RC-H08-1/2', size: inch('1/2"') },
      { sku: 'RC-H08-5/8', size: inch('5/8"') },
      { sku: 'RC-H09-3/4', size: inch('3/4"') },
    ],
  },
  {
    code: 'RC-H-T',
    line: 'RC-H',
    order: 4,
    name: { vi: 'Ống mềm PVC kỹ thuật', en: 'Technical PVC hose' },
    slug: { vi: 'ong-mem-ky-thuat', en: 'technical-hose' },
    summary: {
      vi: 'Nhóm RC-H10 – H13. Ống phun thuốc, ống gân xoắn hút nước, ống hút bụi.',
      en: 'Group RC-H10 – H13. Spray hose, spiral suction hose and dust hose.',
    },
    saleStatus: 'on_sale',
    claimLevel: 'level1_factory',
    cover: 'hoseSpiral',
    images: ['hoseDuct'],
    variants: [
      { sku: 'RC-H10-1/2', size: inch('1/2"') },
      { sku: 'RC-H11-8.5', size: { vi: '8,5 mm', en: '8.5 mm' } },
      { sku: 'RC-H12-1-1/4', size: inch('1 1/4"') },
      { sku: 'RC-H13-1', size: inch('1"') },
    ],
  },
  {
    code: 'RC-S01',
    line: 'RC-S',
    order: 1,
    name: { vi: 'Tấm nhựa tái chế', en: 'Recycled plastic board' },
    slug: { vi: 'tam-nhua-tai-che-rc-s', en: 'recycled-plastic-board' },
    summary: {
      vi: 'Khổ chuẩn 1220 × 2440 mm. Chiều dày, khối lượng từng loại đang chờ nhà máy xác nhận.',
      en: 'Standard 1220 × 2440 mm. Thickness and weight of each type are awaiting factory confirmation.',
    },
    saleStatus: 'coming_soon',
    claimLevel: 'level1_factory',
    variants: [
      { sku: 'RC-S01-1224', size: inch('1220 × 2440 mm') },
      { sku: 'RC-S02-1224', size: inch('1220 × 2440 mm') },
    ],
  },
  {
    code: 'RC-R01',
    line: 'RC-R',
    order: 1,
    name: { vi: 'Tấm lợp nhựa tái chế ép', en: 'Pressed recycled-plastic roofing' },
    slug: { vi: 'tam-lop-nhua-tai-che-ep', en: 'pressed-recycled-roofing' },
    summary: {
      vi: 'Mỗi tấm một vân. Ba chiều dài theo khuôn; chiều dài bán tại Việt Nam đang chốt.',
      en: 'Every sheet has its own pattern. Three mould lengths; lengths for Vietnam to be confirmed.',
    },
    saleStatus: 'coming_soon',
    claimLevel: 'level1_factory',
    cover: 'roofing',
    variants: [
      { sku: 'RC-R01-18', size: inch('1800 mm') },
      { sku: 'RC-R01-21', size: inch('2100 mm') },
      { sku: 'RC-R01-24', size: inch('2400 mm') },
    ],
  },
  {
    code: 'RC-W01',
    line: 'RC-W',
    order: 1,
    name: { vi: 'Tấm ốp tường nhựa tái chế', en: 'Recycled-plastic wall panel' },
    slug: { vi: 'tam-op-tuong-nhua-tai-che', en: 'recycled-wall-panel' },
    summary: {
      vi: 'Mỗi tấm một vẻ. Khổ 1220 × 2440 mm; chiều dày đang chờ nhà máy xác nhận.',
      en: 'Each panel looks different. 1220 × 2440 mm; thickness awaiting factory confirmation.',
    },
    saleStatus: 'coming_soon',
    claimLevel: 'level1_factory',
    cover: 'wallboard',
    variants: [{ sku: 'RC-W01-1224', size: inch('1220 × 2440 mm') }],
  },
]

type Block = { heading: string; text?: string; figure?: string; figureLabel?: string; source?: string }
export type PageSeed = {
  key: string
  kind?: 'standard' | 'legal'
  publish: boolean
  hero?: string
  vi: { kicker?: string; title: string; titleAccent?: string; summary?: string; blocks?: Block[]; body?: string[] }
  en: { kicker?: string; title: string; titleAccent?: string; summary?: string; blocks?: Block[]; body?: string[] }
}

export const PAGES: PageSeed[] = [
  {
    key: 'home',
    publish: true,
    hero: 'factoryLine',
    vi: {
      kicker: 'Vật liệu nhựa cho công trình',
      title: 'Ống nhựa và tấm tái chế,',
      titleAccent: 'cho đại lý và công trình',
      summary:
        'RENCO mang ống uPVC, ống mềm PVC và tấm nhựa tái chế từ nhà máy REN Group tại Indonesia về Việt Nam. Bán qua nhà phân phối, cửa hàng và đơn vị thi công.',
      blocks: [
        { heading: 'Nhà phân phối', text: 'Có kho, có đội giao hàng, muốn thêm một dòng hàng nhựa xây dựng vào danh mục.' },
        { heading: 'Cửa hàng vật liệu', text: 'Lấy hàng theo đơn nhỏ, bán lẻ cho thợ và chủ nhà trong khu vực.' },
        { heading: 'Đơn vị thi công', text: 'Cần báo giá theo khối lượng cho từng công trình.' },
      ],
    },
    en: {
      kicker: 'Plastic building materials',
      title: 'Plastic pipes and recycled boards,',
      titleAccent: 'for dealers and building sites',
      summary:
        'RENCO brings uPVC pipes, PVC hoses and recycled plastic boards from the REN Group factory in Indonesia to Vietnam, sold through distributors, stores and contractors.',
      blocks: [
        { heading: 'Distributors', text: 'You have a warehouse and delivery team and want a plastic building-materials line.' },
        { heading: 'Building-materials stores', text: 'Order in small lots and sell to builders and homeowners in your area.' },
        { heading: 'Contractors', text: 'Get volume quotes for each project.' },
      ],
    },
  },
  {
    key: 'about',
    publish: true,
    hero: 'factoryStore',
    vi: {
      kicker: 'Về RENCO',
      title: 'Một pháp nhân Việt Nam,',
      titleAccent: 'một nhà máy Indonesia',
      summary: 'RENCO là thương hiệu do Công ty TNHH Renvindo Greenplast International (RGI) nhập khẩu và phân phối tại Việt Nam.',
      blocks: [
        { heading: 'Pháp nhân tại Việt Nam', text: 'Công ty TNHH Renvindo Greenplast International, mã số doanh nghiệp 0319717793, trụ sở tại 34 Lê Duẩn, Phường Sài Gòn, TP. Hồ Chí Minh.' },
        { heading: 'Nơi sản xuất', text: 'Hàng RENCO sản xuất tại nhà máy REN Group ở Tangerang, Indonesia.' },
        { heading: 'Cách bán hàng', text: 'RGI bán qua ba kênh: nhà phân phối, cửa hàng vật liệu xây dựng và đơn vị thi công.' },
      ],
      body: [
        '## RENCO làm gì',
        'RGI nhập khẩu hàng RENCO từ nhà máy và bán cho đối tác tại Việt Nam. Mỗi dòng sản phẩm có mã riêng để đối tác tra cứu và đặt hàng nhanh.',
        '## Vì sao chọn RENCO',
        '- Một đầu mối cho năm dòng hàng nhựa xây dựng.',
        '- Hàng từ nhà máy có dây chuyền tái chế nhựa.',
        '- Chính sách riêng cho từng kênh.',
      ],
    },
    en: {
      kicker: 'About RENCO',
      title: 'A Vietnamese company,',
      titleAccent: 'an Indonesian factory',
      summary: 'RENCO is imported and distributed in Vietnam by Renvindo Greenplast International Company Limited (RGI).',
      blocks: [
        { heading: 'Vietnamese legal entity', text: 'Renvindo Greenplast International Company Limited, enterprise code 0319717793, registered at 34 Le Duan Street, Sai Gon Ward, Ho Chi Minh City.' },
        { heading: 'Where it is made', text: 'RENCO products are made at the REN Group factory in Tangerang, Indonesia.' },
        { heading: 'How we sell', text: 'RGI sells through three channels: distributors, building-materials stores and contractors.' },
      ],
      body: [
        '## What RENCO does',
        'RGI imports RENCO products from the factory and sells them to partners in Vietnam. Each product line has its own codes so partners can look up and order quickly.',
        '## Why RENCO',
        '- One supplier for five plastic building-material lines.',
        '- Products from a factory with its own plastic recycling lines.',
        '- Separate terms for each channel.',
      ],
    },
  },
  {
    key: 'factory',
    publish: true,
    hero: 'factoryHall',
    vi: {
      kicker: 'Nhà máy và tái chế',
      title: 'Nhựa cũ,',
      titleAccent: 'đời thứ hai',
      summary: 'Hàng RENCO sản xuất tại nhà máy REN Group ở Tangerang, Indonesia — nhà máy có dây chuyền tái chế nhựa.',
      blocks: [
        { heading: 'Nhựa tái chế mỗi tháng', figure: '~750 tấn', text: FACTORY_RECYCLING_STATEMENT.vi },
        { heading: 'Nơi sản xuất', figure: 'Tangerang', text: 'Nhà máy REN Group tại Tangerang, Indonesia.' },
        { heading: 'Dòng sản phẩm', figure: '5', text: 'Ống uPVC, ống mềm PVC, tấm nhựa, tấm lợp, tấm ốp tường.' },
      ],
      body: [
        '## Thang ba cấp khi nói về tái chế',
        'RENCO chỉ nói điều có giấy tờ chứng minh. Mỗi sản phẩm được gắn một trong ba cấp:',
        '- Cấp 1 — thông tin nhà máy: sản phẩm làm tại nhà máy có dây chuyền tái chế.',
        '- Cấp 2 — tỉ lệ nhựa tái chế trong sản phẩm, tính theo phiếu cân đối nguyên liệu.',
        '- Cấp 3 — có chứng nhận GRS hoặc RCS.',
        'Ống uPVC không mang nhãn tái chế.',
      ],
    },
    en: {
      kicker: 'Factory and recycling',
      title: 'Old plastic,',
      titleAccent: 'second life',
      summary: 'RENCO products are made at the REN Group factory in Tangerang, Indonesia, which runs plastic recycling lines.',
      blocks: [
        { heading: 'Plastic recycled each month', figure: '~750 t', text: FACTORY_RECYCLING_STATEMENT.en },
        { heading: 'Where it is made', figure: 'Tangerang', text: 'REN Group factory in Tangerang, Indonesia.' },
        { heading: 'Product lines', figure: '5', text: 'uPVC pipes, PVC hoses, plastic boards, roofing and wall panels.' },
      ],
      body: [
        '## A three-level scale for recycling claims',
        'RENCO only says what it can document. Each product carries one of three levels:',
        '- Level 1 — factory information: made at a factory with recycling lines.',
        '- Level 2 — recycled content in the product, based on a material balance record.',
        '- Level 3 — GRS or RCS certified.',
        'uPVC pipes carry no recycling label.',
      ],
    },
  },
  {
    key: 'products',
    publish: true,
    vi: { kicker: 'Sản phẩm', title: 'Năm dòng sản phẩm', titleAccent: 'RENCO', summary: 'Chọn dòng để xem mã, cỡ và tài liệu. Cần báo giá theo công trình, bấm "Nhận báo giá" ở từng trang.' },
    en: { kicker: 'Products', title: 'Five RENCO', titleAccent: 'product lines', summary: 'Pick a line to see codes, sizes and documents. For a project quote, press "Request a quote" on any page.' },
  },
  {
    key: 'partners',
    publish: true,
    hero: 'hoseGroup',
    vi: {
      kicker: 'Hợp tác',
      title: 'Bán RENCO',
      titleAccent: 'ở khu vực của anh/chị',
      summary: 'Chọn kênh phù hợp và để lại thông tin. Sales RENCO gọi lại, gửi chính sách và bộ mẫu.',
    },
    en: {
      kicker: 'Partners',
      title: 'Sell RENCO',
      titleAccent: 'in your area',
      summary: 'Choose your channel and leave your details. RENCO sales will call you and share our terms and samples.',
    },
  },
  {
    key: 'samples',
    publish: true,
    hero: 'wallboard',
    vi: {
      kicker: 'Bộ mẫu',
      title: 'Cầm mẫu thật',
      titleAccent: 'trước khi đặt hàng',
      summary: 'Bảng mẫu ống mềm, tấm lợp, tấm ốp tường và quyển mẫu gấp. Gửi yêu cầu, sales RENCO liên hệ để hẹn gửi mẫu.',
    },
    en: {
      kicker: 'Samples',
      title: 'Hold real samples',
      titleAccent: 'before you order',
      summary: 'Hose, roofing and wall-panel sample boards and a folding sample book. Send a request and RENCO sales will arrange delivery.',
    },
  },
  {
    key: 'downloads',
    publish: true,
    vi: { kicker: 'Tài liệu', title: 'Catalog và', titleAccent: 'hồ sơ năng lực', summary: 'Tải bản PDF mới nhất. Tài liệu kỹ thuật chi tiết, anh/chị gửi yêu cầu để sales gửi qua email.' },
    en: { kicker: 'Downloads', title: 'Catalog and', titleAccent: 'company profile', summary: 'Download the latest PDFs. For detailed technical documents, send a request and sales will email them.' },
  },
  {
    key: 'contact',
    publish: true,
    vi: { kicker: 'Liên hệ', title: 'Nói chuyện với', titleAccent: 'sales RENCO', summary: 'Gọi hotline, gửi email hoặc để lại lời nhắn. Sales gọi lại trong giờ làm việc.' },
    en: { kicker: 'Contact', title: 'Talk to', titleAccent: 'RENCO sales', summary: 'Call, email or leave a message. Sales will call back during business hours.' },
  },
  {
    key: 'terms',
    kind: 'legal',
    publish: false, // chờ Pháp chế đăng nội dung WB01 và duyệt
    vi: { title: 'Điều khoản sử dụng website', body: ['Nội dung WB01 — Pháp chế dán bản đã duyệt vào đây trước khi xuất bản.'] },
    en: { title: 'Website terms of use', body: ['WB01 content — Legal pastes the approved text here before publishing.'] },
  },
  {
    key: 'privacy',
    kind: 'legal',
    publish: false, // chờ Pháp chế đăng nội dung WB02 và duyệt
    vi: { title: 'Chính sách dữ liệu cá nhân', body: ['Nội dung WB02 — Pháp chế dán bản đã duyệt vào đây trước khi xuất bản.'] },
    en: { title: 'Privacy policy', body: ['WB02 content — Legal pastes the approved text here before publishing.'] },
  },
]

/** Tài khoản mẫu, mỗi vai trò một tài khoản. Email dùng tên miền .test — đổi sang email thật khi triển khai. */
export const USERS = [
  { email: 'director@renco.test', name: 'Giám đốc (mẫu)', role: 'director' },
  { email: 'marketing@renco.test', name: 'Quản lý marketing (mẫu)', role: 'marketing', notifyLeads: true },
  { email: 'sales1@renco.test', name: 'Sales 1 (mẫu)', role: 'sales' },
  { email: 'sales2@renco.test', name: 'Sales 2 (mẫu)', role: 'sales' },
  { email: 'editor@renco.test', name: 'Biên tập (mẫu)', role: 'editor' },
  { email: 'legal@renco.test', name: 'Pháp chế (mẫu)', role: 'legal' },
  { email: 'tech@renco.test', name: 'Quản trị kỹ thuật (mẫu)', role: 'tech' },
] as const
