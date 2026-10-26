/**
 * Dữ liệu sản phẩm theo Catalog RENCO 2026 v3.0 (Figma «RENCO — Copy», page 19 VI `70:57`, page 19b EN `98:57`).
 * Số chép đúng catalog; khoảng "15,6 – 16,0" ghi [15.6, 16.0]. Trang catalog ghi ở chú thích từng khối.
 * Mã sản phẩm RC-P-CN, RC-P-TN: catalog không đặt mã cho hai loại ống này — mã tạm, RGI đổi được trong quản trị.
 */
import type { SpecTemplate } from '../../lib/constants'

type L = { vi: string; en: string }
type Range = number | [number, number]

export type CatalogVariant = { sku: string; size: L; values: Record<string, number | string> }
export type CatalogProduct = {
  code: string
  line: 'RC-P' | 'RC-H' | 'RC-S' | 'RC-R'
  template?: SpecTemplate
  name: L
  slug: L
  group?: L
  summary: L
  uses?: { vi: string[]; en: string[] }
  standardText?: L
  variants: CatalogVariant[]
}
export type CatalogLine = { code: string; name: L; tagline: L; description: L }

const same = (s: string): L => ({ vi: s, en: s })

/** Trang chia mục P05, P09, P17, P19. Đường dẫn dòng giữ nguyên (không đổi link cũ). */
export const LINES: CatalogLine[] = [
  {
    code: 'RC-P',
    name: { vi: 'Ống PVC-U & phụ kiện', en: 'uPVC pipes & fittings' },
    tagline: { vi: 'Ống cấp nước áp lực, ống thoát nước và phụ kiện.', en: 'Pressure pipes, drainage pipes and fittings.' },
    description: {
      vi: 'Ống cấp nước áp lực từ Ø 16 đến Ø 710 mm, ống thoát nước, phụ kiện dán keo và phụ kiện thoát.',
      en: 'Pressure pipes from Ø 16 to Ø 710 mm, drainage pipes, solvent-weld and drainage fittings.',
    },
  },
  {
    code: 'RC-H',
    name: { vi: 'Ống mềm PVC', en: 'PVC hoses' },
    tagline: { vi: 'Ống dẫn nước, ống trong suốt, ống lưới dệt và ống kỹ thuật.', en: 'Water hoses, clear tubing, braided hoses and technical hoses.' },
    description: {
      vi: '13 dòng ống trong 4 nhóm: dẫn nước, trong suốt, lưới dệt, kỹ thuật. Cỡ từ Ø 4,4 đến Ø 206 mm.',
      en: '13 hose lines in 4 groups: water, clear, braided and technical. Sizes from Ø 4.4 to Ø 206 mm.',
    },
  },
  {
    code: 'RC-S',
    name: { vi: 'Tấm nhựa tái chế', en: 'Recycled plastic sheets' },
    tagline: { vi: 'Tấm lót máng xối, tấm PE và tấm PP.', en: 'Gutter liners, PE sheets and PP boards.' },
    description: {
      vi: 'Tấm lót máng xối, tấm PE và tấm PP, sản xuất từ hạt nhựa tái chế đã qua phân loại.',
      en: 'Gutter liners, PE sheets and PP boards made from sorted recycled pellets.',
    },
  },
  {
    code: 'RC-R',
    name: { vi: 'Tấm lợp nhựa tái chế ép', en: 'Pressed recycled roofing sheets' },
    tagline: { vi: 'Sắp ra mắt.', en: 'Coming soon.' },
    description: {
      vi: 'Dòng sản phẩm sẽ được giới thiệu trong bản cập nhật tiếp theo của catalog.',
      en: 'This product line will be introduced in the next edition of the catalogue.',
    },
  },
]

// ── P06: ống cấp nước áp lực — chiều dày theo dãy S; null = cỡ không có ở dãy đó ──
const SERIES = [6.3, 8, 10, 12.5, 16]
const PN_SMALL = [16, 12.5, 10, 8, 6] // dn ≤ 90
const PN_LARGE = [20, 16, 12.5, 10, 8] // dn > 90
const PRESSURE: [number, (number | null)[]][] = [
  [16, [1.5, null, null, null, null]],
  [20, [1.5, null, null, null, null]],
  [25, [1.9, 1.5, null, null, null]],
  [32, [2.4, 1.9, 1.6, null, null]],
  [40, [3.0, 2.4, 1.9, 1.6, 1.5]],
  [50, [3.7, 3.0, 2.4, 2.0, 1.6]],
  [63, [4.7, 3.8, 3.0, 2.4, 2.0]],
  [75, [5.5, 4.5, 3.6, 2.9, 2.3]],
  [90, [6.6, 5.4, 4.3, 3.5, 2.8]],
  [110, [8.2, 6.6, 5.3, 4.2, 3.4]],
  [125, [9.2, 7.4, 6.0, 4.8, 3.9]],
  [140, [10.3, 8.3, 6.7, 5.4, 4.3]],
  [160, [11.8, 9.5, 7.7, 6.2, 4.9]],
  [200, [14.7, 11.9, 9.6, 7.7, 6.2]],
  [225, [16.6, 13.4, 10.8, 8.6, 6.9]],
  [250, [18.4, 14.8, 11.9, 9.6, 7.7]],
  [280, [20.6, 16.6, 13.4, 10.7, 8.6]],
  [315, [23.2, 18.7, 15.0, 12.1, 9.7]],
  [355, [26.1, 21.1, 16.9, 13.6, 10.9]],
  [400, [29.4, 23.7, 19.1, 15.3, 12.3]],
  [450, [null, 26.7, 21.5, 17.2, 13.8]],
  [500, [null, 29.6, 23.9, 19.1, 15.3]],
  [630, [null, null, 30.0, 24.1, 19.3]],
  [710, [null, null, null, 27.2, 21.8]],
]
const pressureVariants = (): CatalogVariant[] =>
  PRESSURE.flatMap(([dn, row]) =>
    row.flatMap((e, i) =>
      e == null
        ? []
        : [
            {
              sku: `RC-P-CN-${dn}-S${String(SERIES[i]).replace('.', '_')}`,
              size: same(String(dn)),
              values: { dnMm: dn, eMm: e, pipeSeries: SERIES[i], pnBar: dn <= 90 ? PN_SMALL[i] : PN_LARGE[i] },
            },
          ],
    ),
  )

// ── P07: ống thoát nước — chiều dày Class A / Class B ──
const DRAIN: [number, number, number][] = [
  [40, 1.8, 3.2],
  [50, 1.8, 3.2],
  [63, 1.8, 3.2],
  [75, 1.8, 3.2],
  [90, 1.8, 3.2],
  [110, 2.2, 3.2],
  [125, 2.5, 3.2],
  [160, 3.2, 4.0],
  [200, 3.9, 4.9],
  [250, 4.9, 6.2],
  [315, 6.2, 7.7],
  [355, 7.0, 8.7],
  [400, 7.8, 9.8],
  [500, 9.8, 12.3],
]
const drainVariants = (): CatalogVariant[] =>
  DRAIN.flatMap(([dn, a, b]) =>
    (
      [
        ['A', a],
        ['B', b],
      ] as const
    ).map(([cls, e]) => ({ sku: `RC-P-TN-${dn}-${cls}`, size: same(String(dn)), values: { dnMm: dn, eMm: e, wallClass: cls } })),
  )

// ── P08: phụ kiện — mã + tên, không số đo ──
const fittings = (list: [string, string, string][]): CatalogVariant[] => list.map(([sku, vi, en]) => ({ sku, size: { vi, en }, values: {} }))

// ── P10 – P16: ống mềm — [cỡ, Ø trong, Ø ngoài, dài cuộn, kg/cuộn] ──
type HoseRow = [string, number, Range, number, Range]
const hose = (code: string, rows: HoseRow[]): CatalogVariant[] =>
  rows.map(([size, id, od, coil, kg], i) => {
    const [odMin, odMax] = Array.isArray(od) ? od : [od, null]
    const [kgMin, kgMax] = Array.isArray(kg) ? kg : [kg, null]
    const values: Record<string, number> = { idMm: id, odMm: odMin, coilLengthM: coil, weightKgPerCoilMin: kgMin }
    if (odMax != null) values.odMaxMm = odMax
    if (kgMax != null) values.weightKgPerCoilMax = kgMax
    return { sku: `${code}-${String(i + 1).padStart(2, '0')}`, size: same(size), values }
  })

const WATER: L = { vi: 'Dẫn nước', en: 'Water' }
const CLEAR: L = { vi: 'Trong suốt', en: 'Clear' }
const BRAIDED: L = { vi: 'Lưới dệt', en: 'Braided' }
const TECH: L = { vi: 'Kỹ thuật', en: 'Technical' }
const USES_WATER = { vi: ['Dẫn nước sinh hoạt gia đình', 'Tưới vườn'], en: ['Household water supply', 'Garden watering'] }
const USES_CLEAR = { vi: ['Hồ cá', 'Ống thuỷ đo cân bằng', 'Dẫn nước gia dụng'], en: ['Aquariums', 'Water levels for setting out', 'Household water'] }
const USES_BRAIDED = { vi: ['Dẫn nước gia dụng', 'Tưới vườn', 'Công nghiệp'], en: ['Household water', 'Garden watering', 'Industry'] }
const colours = (vi: string, en: string): L => ({ vi: `Màu: ${vi}.`, en: `Colours: ${en}.` })
const colour = (vi: string, en: string): L => ({ vi: `Màu: ${vi}.`, en: `Colour: ${en}.` })

export const PRODUCTS: CatalogProduct[] = [
  // P06
  {
    code: 'RC-P-CN',
    line: 'RC-P',
    template: 'pressure_pipe',
    name: { vi: 'Ống cấp nước áp lực', en: 'uPVC pressure pipes' },
    slug: { vi: 'ong-cap-nuoc-ap-luc', en: 'upvc-pressure-pipes' },
    summary: {
      vi: 'Ống PVC-U hệ mét dn 16 – 710 mm, 5 dãy S. Hai kiểu đầu nối: nong dán keo hoặc nong gioăng cao su. Chiều dài tiêu chuẩn và màu: theo đơn đặt hàng.',
      en: 'Metric uPVC pipes dn 16 – 710 mm in 5 S series. Two joint types: solvent-weld socket or rubber-ring socket. Standard length and colour to order.',
    },
    uses: { vi: ['Cấp nước có áp trong nhà, công trình'], en: ['Pressurised water supply in buildings'] },
    standardText: same('TCVN 8491-2:2011 (ISO 1452-2)'),
    variants: pressureVariants(),
  },
  // P07
  {
    code: 'RC-P-TN',
    line: 'RC-P',
    template: 'drain_pipe',
    name: { vi: 'Ống thoát nước', en: 'Drainage pipes' },
    slug: { vi: 'ong-thoat-nuoc', en: 'drainage-pipes' },
    summary: {
      vi: 'Ống thoát nước thải, nước mưa, thông hơi. Hai cấp chiều dày Class A và Class B, đường kính ngoài 40 – 500 mm.',
      en: 'Soil, rainwater and vent pipes. Two wall classes, Class A and Class B, outside diameter 40 – 500 mm.',
    },
    uses: { vi: ['Thoát nước', 'Thông hơi'], en: ['Drainage', 'Venting'] },
    standardText: { vi: 'SNI (Indonesia)', en: 'SNI (Indonesia)' },
    variants: drainVariants(),
  },
  // P08
  {
    code: 'RC-PF',
    line: 'RC-P',
    template: 'fitting',
    name: { vi: 'Phụ kiện cấp nước (dán keo)', en: 'Pressure fittings (solvent weld)' },
    slug: { vi: 'phu-kien-cap-nuoc', en: 'pressure-fittings' },
    summary: { vi: '16 loại phụ kiện dán keo cho ống cấp nước. Có 2 màu: trắng, xanh ngọc.', en: '16 solvent-weld fittings for pressure pipes. Two colours: white, teal.' },
    uses: { vi: ['Cấp nước có áp trong nhà, công trình'], en: ['Pressurised water supply in buildings'] },
    variants: fittings([
      ['RC-PF01', 'Nối ren trong', 'Female threaded socket'],
      ['RC-PF02', 'Nối ren ngoài', 'Male threaded adaptor'],
      ['RC-PF03', 'Co ren trong', 'Female threaded elbow'],
      ['RC-PF04', 'Co 90°', '90° elbow'],
      ['RC-PF05', 'Tê ren trong', 'Female threaded tee'],
      ['RC-PF06', 'Tê đều', 'Equal tee'],
      ['RC-PF07', 'Tê thu', 'Reducing tee'],
      ['RC-PF08', 'Nối thẳng', 'Coupling'],
      ['RC-PF09', 'Nối thu', 'Reducing coupling'],
      ['RC-PF10', 'Co ren trong lõi kim loại', 'Female elbow, metal insert'],
      ['RC-PF11', 'Nối ren trong lõi kim loại', 'Female socket, metal insert'],
      ['RC-PF12', 'Kép ren ngoài', 'Double male nipple'],
      ['RC-PF13', 'Nối giảm ren', 'Reducing bush'],
      ['RC-PF14', 'Mặt bích PVC', 'PVC flange'],
      ['RC-PF15', 'Đai kẹp ống', 'Pipe saddle clamp'],
      ['RC-PF16', 'Nút bịt ren', 'Threaded plug'],
    ]),
  },
  {
    code: 'RC-PD',
    line: 'RC-P',
    template: 'fitting',
    name: { vi: 'Phụ kiện thoát nước & thông hơi', en: 'Drainage & vent fittings' },
    slug: { vi: 'phu-kien-thoat-nuoc', en: 'drainage-fittings' },
    summary: { vi: '9 loại phụ kiện cho ống thoát nước và thông hơi.', en: '9 fittings for drainage and vent pipes.' },
    uses: { vi: ['Thoát nước', 'Thông hơi'], en: ['Drainage', 'Venting'] },
    variants: fittings([
      ['RC-PD01', 'Co 90° thoát', '90° drain elbow'],
      ['RC-PD02', 'Co 67°30′', '67°30′ elbow'],
      ['RC-PD03', 'Co 45°', '45° elbow'],
      ['RC-PD04', 'Tê thoát', 'Drain tee'],
      ['RC-PD05', 'Tê Y 90°', '90° Y-tee'],
      ['RC-PD06', 'Chếch Y 45°', '45° Y-branch'],
      ['RC-PD07', 'Nối thu thoát', 'Drain reducer'],
      ['RC-PD08', 'Nối thẳng thoát', 'Drain coupling'],
      ['RC-PD09', 'Phễu thoát sàn', 'Floor drain outlet'],
    ]),
  },
  // P10
  {
    code: 'RC-H01',
    line: 'RC-H',
    template: 'hose',
    group: WATER,
    name: { vi: 'Ống mềm PVC đàn hồi màu', en: 'Coloured flexible PVC hose' },
    slug: { vi: 'ong-mem-pvc-dan-hoi-mau', en: 'coloured-flexible-pvc-hose' },
    summary: colours('xanh dương, xanh lá, cam', 'blue, green, orange'),
    uses: USES_WATER,
    variants: hose('RC-H01', [
      ['1/2"', 12.4, [15.6, 16.0], 50, [4.7, 4.8]],
      ['1/2"', 12.4, [15.6, 16.0], 100, [9.5, 9.7]],
      ['5/8"', 15.5, [19.1, 19.5], 50, [6.1, 6.3]],
      ['5/8"', 15.5, [19.1, 19.5], 100, [12.2, 12.6]],
      ['3/4"', 18.7, [22.7, 22.9], 50, [8.1, 8.2]],
      ['3/4"', 18.7, [22.7, 22.9], 100, [16.2, 16.5]],
      ['1"', 25.0, [29.2, 29.4], 50, [11.2, 11.6]],
    ]),
  },
  {
    code: 'RC-H02',
    line: 'RC-H',
    template: 'hose',
    group: WATER,
    name: { vi: 'Ống mềm PVC đàn hồi sọc', en: 'Striped flexible PVC hose' },
    slug: { vi: 'ong-mem-pvc-dan-hoi-soc', en: 'striped-flexible-pvc-hose' },
    summary: colours('xanh dương, xanh lá, cam', 'blue, green, orange'),
    uses: USES_WATER,
    variants: hose('RC-H02', [
      ['1/2"', 12.4, [15.6, 16.0], 50, [4.7, 4.8]],
      ['1/2"', 12.4, [15.6, 16.0], 100, [9.5, 9.7]],
      ['5/8"', 15.5, [19.1, 19.5], 50, [6.1, 6.3]],
      ['5/8"', 15.5, [19.1, 19.5], 100, [12.2, 12.6]],
      ['3/4"', 18.7, [22.7, 22.9], 50, [8.2, 8.5]],
      ['3/4"', 18.7, [22.7, 22.9], 100, [16.5, 17.0]],
      ['1"', 25.0, [29.2, 29.4], 50, [11.6, 12.0]],
    ]),
  },
  // P11
  {
    code: 'RC-H03',
    line: 'RC-H',
    template: 'hose',
    group: WATER,
    name: { vi: 'Ống mềm PVC siêu dẻo', en: 'Super-flexible PVC hose' },
    slug: { vi: 'ong-mem-pvc-sieu-deo', en: 'super-flexible-pvc-hose' },
    summary: colours('xanh dương, xanh lá', 'blue, green'),
    uses: USES_WATER,
    variants: hose('RC-H03', [
      ['1/2"', 11.4, 15.8, 50, [6.2, 6.4]],
      ['5/8"', 14.1, 19.2, 50, [9.0, 9.2]],
      ['3/4"', 16.5, 22.4, 50, [12.2, 12.5]],
      ['1"', 22.9, 29.3, 50, [15.7, 16.0]],
    ]),
  },
  {
    code: 'RC-H04',
    line: 'RC-H',
    template: 'hose',
    group: WATER,
    name: { vi: 'Ống mềm PVC dẻo DOP', en: 'DOP flexible PVC hose' },
    slug: { vi: 'ong-mem-pvc-deo-dop', en: 'dop-flexible-pvc-hose' },
    summary: colours('xanh dương, xanh lá', 'blue, green'),
    uses: USES_WATER,
    variants: hose('RC-H04', [
      ['1/2"', 12.4, [14.4, 14.6], 50, [2.8, 2.9]],
      ['1/2"', 12.4, [14.4, 14.6], 100, [5.6, 5.8]],
      ['5/8"', 15.5, [17.7, 17.9], 50, [3.8, 3.9]],
      ['5/8"', 15.5, [17.7, 17.9], 100, [7.6, 7.8]],
      ['3/4"', 18.7, 21.3, 50, [4.9, 5.0]],
      ['3/4"', 18.7, 21.3, 100, [9.8, 10.0]],
      ['7/8"', 21.9, 24.7, 50, [6.1, 6.2]],
      ['7/8"', 21.9, 27.8, 100, [12.2, 12.5]], // catalog ghi 27,8 — nghi chép nhầm (cuộn 50 m là 24,7)
      ['1"', 25.0, 27.8, 50, [6.7, 7.0]],
      ['1"', 25.0, 27.8, 100, [15.2, 15.5]],
      ['1 1/4"', 31.0, 34.0, 50, [10.0, 10.5]],
      ['1 1/2"', 37.4, 40.6, 50, [13.5, 14.0]],
    ]),
  },
  // P12
  {
    code: 'RC-H05',
    line: 'RC-H',
    template: 'hose',
    group: WATER,
    name: { vi: 'Ống mềm PVC DOP tiêu chuẩn', en: 'Standard DOP PVC hose' },
    slug: { vi: 'ong-mem-pvc-dop-tieu-chuan', en: 'standard-dop-pvc-hose' },
    summary: colours('xanh dương, xanh ngọc', 'blue, teal'),
    uses: USES_WATER,
    variants: hose('RC-H05', [
      ['1/2"', 12.4, [14.0, 14.2], 50, [2.2, 2.4]],
      ['1/2"', 12.4, [14.0, 14.2], 100, [4.5, 4.8]],
      ['5/8"', 15.5, [17.2, 17.7], 50, [2.9, 3.0]],
      ['5/8"', 15.5, [17.2, 17.7], 100, [5.8, 6.0]],
      ['3/4"', 18.7, 21.1, 50, [4.1, 4.3]],
      ['3/4"', 18.7, 21.1, 100, [8.3, 8.6]],
      ['7/8"', 21.9, 24.5, 50, [5.2, 5.5]],
      ['7/8"', 21.9, 24.5, 100, [10.5, 11.0]],
      ['1"', 25.0, 27.6, 50, [7.1, 7.3]],
      ['1"', 25.0, 27.6, 100, [15.2, 15.5]],
    ]),
  },
  {
    code: 'RC-H06',
    line: 'RC-H',
    template: 'hose',
    group: CLEAR,
    name: { vi: 'Ống mềm PVC trong suốt', en: 'Clear PVC tubing' },
    slug: { vi: 'ong-mem-pvc-trong-suot', en: 'clear-pvc-tubing' },
    summary: colour('trong suốt', 'clear'),
    uses: USES_CLEAR,
    variants: hose('RC-H06', [
      ['3/16"', 4.4, [5.6, 5.8], 100, [1.4, 1.5]],
      ['1/4"', 6.0, [7.3, 7.4], 100, [1.7, 1.8]],
      ['5/16"', 7.6, [9.0, 9.2], 100, [2.4, 2.5]],
      ['3/8"', 9.2, [10.8, 11.0], 100, [3.4, 3.5]],
    ]),
  },
  // P13
  {
    code: 'RC-H07',
    line: 'RC-H',
    template: 'hose',
    group: CLEAR,
    name: { vi: 'Ống mềm PVC trong suốt dày', en: 'Heavy-wall clear PVC tubing' },
    slug: { vi: 'ong-mem-pvc-trong-suot-day', en: 'heavy-wall-clear-pvc-tubing' },
    summary: colour('trong suốt', 'clear'),
    uses: USES_CLEAR,
    variants: hose('RC-H07', [
      ['3/16"', 4.4, [6.8, 7.0], 100, [1.4, 1.5]],
      ['1/4"', 6.0, [9.0, 9.2], 100, [1.7, 1.8]],
      ['5/16"', 7.6, [11.4, 11.6], 100, [2.4, 2.5]],
      ['3/8"', 9.2, [13.2, 13.4], 100, [3.4, 3.5]],
      ['1/2"', 12.4, [16.2, 16.4], 50, [5.2, 5.5]],
      ['1/2"', 12.4, [16.2, 16.4], 100, [13.5, 14.0]],
      ['5/8"', 15.5, [19.5, 19.9], 50, [6.7, 7.0]],
      ['5/8"', 15.5, [19.5, 19.9], 100, [13.5, 14.0]],
      ['3/4"', 18.7, [22.9, 23.3], 50, [6.7, 7.5]],
      ['3/4"', 18.7, [22.9, 23.3], 100, [18.0, 18.5]],
      ['7/8"', 21.9, [26.1, 26.5], 50, [11.0, 11.5]],
      ['1"', 25.0, [29.6, 29.8], 50, [12.5, 13.0]],
      ['1 1/4"', 31.0, [35.8, 36.0], 50, [15.0, 15.5]],
      ['1 1/2"', 37.4, [42.4, 42.6], 50, [20.5, 21.0]],
      ['1 3/4"', 43.7, [48.9, 49.1], 50, [25.0, 26.0]],
      ['2"', 50.0, [56.0, 56.4], 50, [34.0, 35.0]],
    ]),
  },
  {
    code: 'RC-H08',
    line: 'RC-H',
    template: 'hose',
    group: BRAIDED,
    name: { vi: 'Ống mềm PVC lưới dệt loại nhẹ', en: 'Lightweight braided PVC hose' },
    slug: { vi: 'ong-mem-pvc-luoi-det-loai-nhe', en: 'lightweight-braided-pvc-hose' },
    summary: colour('trong suốt', 'clear'),
    uses: USES_BRAIDED,
    variants: hose('RC-H08', [
      ['1/2"', 12.0, [15.0, 15.4], 100, [9.0, 9.5]],
      ['5/8"', 14.0, [17.0, 17.4], 100, [11.5, 12.0]],
      ['3/4"', 18.2, [21.6, 21.8], 100, [15.0, 15.5]],
      ['1"', 24.0, [28.0, 28.4], 50, [12.0, 12.5]],
    ]),
  },
  // P14
  {
    code: 'RC-H09',
    line: 'RC-H',
    template: 'hose',
    group: BRAIDED,
    name: { vi: 'Ống mềm PVC lưới dệt', en: 'Braided PVC hose' },
    slug: { vi: 'ong-mem-pvc-luoi-det', en: 'braided-pvc-hose' },
    summary: colours('trong suốt, sợi xanh lá', 'clear, green yarn'),
    uses: USES_BRAIDED,
    variants: hose('RC-H09', [
      ['3/16"', 4.4, [7.7, 8.0], 100, [4.2, 4.5]],
      ['1/4"', 6.0, [9.3, 9.6], 100, [5.2, 5.5]],
      ['5/16"', 7.6, [10.8, 11.4], 100, [6.2, 6.5]],
      ['3/8"', 9.2, [13.2, 13.4], 100, [9.2, 9.5]],
      ['1/2"', 12.4, [16.6, 17.0], 50, [6.2, 6.5]],
      ['1/2"', 12.4, [16.6, 17.0], 100, [12.5, 13.0]],
      ['5/8"', 15.5, [20.1, 20.7], 50, [8.2, 8.5]],
      ['5/8"', 15.5, [20.1, 20.7], 100, [16.5, 17.0]],
      ['3/4"', 18.7, [23.7, 24.1], 50, [10.7, 11.0]],
      ['3/4"', 18.7, [23.7, 24.1], 100, [21.5, 22.0]],
      ['7/8"', 21.9, [27.1, 27.5], 50, [13.5, 13.8]],
      ['1"', 25.0, [30.4, 30.8], 50, [14.0, 15.0]],
      ['1 1/4"', 31.0, [37.4, 39.0], 50, [22.0, 23.0]],
      ['1 1/2"', 37.4, [44.8, 46.2], 50, [32.0, 33.0]],
      ['1 3/4"', 43.7, [51.7, 53.3], 50, [40.0, 41.0]],
      ['2"', 50.0, [59.0, 61.0], 50, 55.0],
    ]),
  },
  {
    code: 'RC-H10',
    line: 'RC-H',
    template: 'hose',
    group: TECH,
    name: { vi: 'Ống ruột gà luồn dây', en: 'Corrugated cable conduit' },
    slug: { vi: 'ong-ruot-ga-luon-day', en: 'corrugated-cable-conduit' },
    summary: colours('đen, trắng', 'black, white'),
    uses: { vi: ['Đi gọn và bảo vệ dây điện', 'Ống thoát nước máy lạnh'], en: ['Routing and protecting electrical cables', 'Air-conditioner drain lines'] },
    variants: hose('RC-H10', [
      ['1/2"', 13.0, 17.6, 50, [1.3, 1.4]],
      ['5/8"', 15.3, 20.0, 50, [1.4, 1.5]],
      ['3/4"', 19.6, 24.5, 50, [1.8, 2.0]],
      ['1"', 25.0, 30.2, 50, [3.0, 3.5]],
    ]),
  },
  // P15
  {
    code: 'RC-H11',
    line: 'RC-H',
    template: 'hose',
    group: TECH,
    name: { vi: 'Ống hơi khí nén', en: 'Compressed-air hose' },
    slug: { vi: 'ong-hoi-khi-nen', en: 'compressed-air-hose' },
    summary: colour('vàng', 'yellow'),
    uses: { vi: ['Khí nén trong xưởng', 'Tiệm vá xe', 'Bếp nhà hàng'], en: ['Workshop compressed air', 'Tyre repair shops', 'Restaurant kitchens'] },
    variants: hose('RC-H11', [
      ['8,5 mm', 8.5, 14.5, 50, [6.1, 6.3]],
      ['8,5 mm', 8.5, 14.5, 100, [12.2, 12.5]],
    ]).map((v) => ({ ...v, size: { vi: '8,5 mm', en: '8.5 mm' } })),
  },
  {
    code: 'RC-H12',
    line: 'RC-H',
    template: 'hose',
    group: TECH,
    name: { vi: 'Ống hút bụi công nghiệp', en: 'Industrial duct hose' },
    slug: { vi: 'ong-hut-bui-cong-nghiep', en: 'industrial-duct-hose' },
    summary: colour('trắng', 'white'),
    uses: { vi: ['Hút bụi gỗ', 'Bụi công nghiệp', 'Đường ống quạt hút'], en: ['Wood dust extraction', 'Industrial dust extraction', 'Fan ducting'] },
    variants: hose('RC-H12', [
      ['1 1/4"', 29.5, 38.2, 50, [17.0, 17.5]],
      ['2"', 49.6, 57.1, 50, [29.0, 30.0]],
      ['2 1/2"', 61.2, 70.0, 50, [35.0, 35.5]],
      ['3"', 76.0, 86.4, 50, [44.0, 45.0]],
      ['4"', 103.0, 113.7, 25, [32.5, 33.0]],
      ['5"', 123.7, 137.6, 25, [45.0, 45.6]],
      ['6"', 151.0, 165.0, 25, 53.0],
      ['8"', 203.0, 219.0, 6, [20.0, 21.0]],
    ]),
  },
  // P16
  {
    code: 'RC-H13',
    line: 'RC-H',
    template: 'hose',
    group: TECH,
    name: { vi: 'Ống hút xoắn', en: 'Spiral suction hose' },
    slug: { vi: 'ong-hut-xoan', en: 'spiral-suction-hose' },
    summary: colour('xanh dương', 'blue'),
    uses: { vi: ['Tưới tiêu vườn, ruộng', 'Xử lý nước thải', 'Nhà máy nhựa'], en: ['Garden and field irrigation', 'Wastewater handling', 'Plastics plants'] },
    variants: hose('RC-H13', [
      ['1"', 25.5, 34.2, 50, [15.5, 16.0]],
      ['1 1/4"', 31.0, 40.4, 50, [17.5, 18.0]],
      ['1 1/2"', 37.4, 46.2, 50, [22.5, 23.0]],
      ['1 3/4"', 44.2, 52.8, 50, [28.0, 28.5]],
      ['2"', 50.0, 60.9, 50, [33.0, 34.0]],
      ['2 1/2"', 62.4, 72.7, 50, [45.0, 46.0]],
      ['3"', 75.7, 88.3, 50, [60.0, 62.0]],
      ['4"', 103.0, 119.4, 25, [45.0, 46.0]],
      ['4 1/2"', 114.0, 129.5, 25, [59.0, 60.0]],
      ['5"', 128.0, 145.0, 20, [53.0, 54.0]],
      ['5 1/2"', 144.5, 159.5, 20, 56.0],
      ['6"', 153.0, 173.0, 20, [74.0, 75.0]],
      ['8"', 206.0, 229.5, 6, 35.0],
    ]),
  },
  // P18
  {
    code: 'RC-S01',
    line: 'RC-S',
    template: 'gutter_liner',
    name: { vi: 'Tấm lót máng xối', en: 'Gutter liner' },
    slug: { vi: 'tam-lot-mang-xoi', en: 'gutter-liner' },
    summary: {
      vi: 'Lót máng xối, máng thoát nước mái nhà ở. Cuộn sẵn theo chiều dài, dễ cắt tại công trình. Nguyên liệu: HDPE, PVC · Màu: xanh lá.',
      en: 'Lines roof gutters and drainage channels on houses. Supplied in rolls by length and easy to cut on site. Material: HDPE, PVC · Colour: green.',
    },
    uses: { vi: ['Lót máng xối mái nhà'], en: ['Roof gutter lining'] },
    // Hai cột độc lập như catalog: dòng thứ i chỉ là vị trí trong bảng, không phải cặp cố định.
    variants: (
      [
        [1.45, 55],
        [2.47, 60],
        [3.48, 70],
        [4.49, 90],
        [5.5, 110],
      ] as const
    ).map(([len, cm], i) => ({ sku: `RC-S01-0${i + 1}`, size: { vi: `Dòng ${i + 1}`, en: `Row ${i + 1}` }, values: { lengthM: len, widthMm: cm * 10 } })),
  },
  {
    code: 'RC-S02',
    line: 'RC-S',
    template: 'sheet',
    name: { vi: 'Tấm PE vân ô', en: 'Embossed PE sheet' },
    slug: { vi: 'tam-pe-van-o', en: 'embossed-pe-sheet' },
    summary: { vi: 'Tấm PE có vân ô, dùng che phủ, lót sàn tạm, bao bọc hàng hoá.', en: 'PE sheet with a grid emboss for covering, temporary floor lining and wrapping goods.' },
    uses: { vi: ['Che phủ', 'Lót sàn tạm', 'Bọc hàng'], en: ['Covering', 'Temporary floor lining', 'Wrapping'] },
    variants: [{ sku: 'RC-S02-01', size: { vi: 'Khổ 1 m · dài 1,25 m', en: 'Width 1 m · length 1.25 m' }, values: { lengthMm: 1250, widthMm: 1000 } }],
  },
  {
    code: 'RC-S03',
    line: 'RC-S',
    template: 'sheet',
    name: { vi: 'Tấm PE trơn', en: 'Plain PE sheet' },
    slug: { vi: 'tam-pe-tron', en: 'plain-pe-sheet' },
    summary: { vi: 'Tấm PE mặt trơn, dùng lót, che phủ công trình. Thông số: đang cập nhật.', en: 'Smooth PE sheet for lining and covering on site. Specifications: in preparation.' },
    uses: { vi: ['Che phủ', 'Lót công trình'], en: ['Covering', 'Site lining'] },
    variants: [],
  },
  {
    code: 'RC-S04',
    line: 'RC-S',
    template: 'sheet',
    name: { vi: 'Tấm PP', en: 'PP board' },
    slug: { vi: 'tam-pp', en: 'pp-board' },
    summary: { vi: 'Tấm PP cứng, dùng làm vách tạm, hàng rào, kệ. Thông số: đang cập nhật.', en: 'Rigid PP board for temporary walls, fencing and shelving. Specifications: in preparation.' },
    uses: { vi: ['Vách tạm', 'Hàng rào', 'Kệ'], en: ['Temporary walls', 'Fencing', 'Shelving'] },
    variants: [],
  },
  // P20
  {
    code: 'RC-R01',
    line: 'RC-R',
    template: 'panel',
    name: { vi: 'Tấm lợp nhựa tái chế ép', en: 'Pressed recycled roofing sheet' },
    slug: { vi: 'tam-lop-nhua-tai-che-ep', en: 'pressed-recycled-roofing-sheet' },
    summary: {
      vi: 'Sắp ra mắt. Thông số kỹ thuật, khả năng chịu nhiệt, chống thấm và tuổi thọ sẽ được công bố sau khi có kết quả thử nghiệm.',
      en: 'Coming soon. Technical data, heat resistance, waterproofing and service life will be published once test results are available.',
    },
    uses: { vi: ['Lợp mái nhà xưởng, nhà kho'], en: ['Roofing for workshops and warehouses'] },
    variants: [],
  },
]

/** Sản phẩm cũ (bản yêu cầu v0.1) không có trong catalog: chuyển về nháp, không xoá. */
export const RETIRED_CODES = ['RC-P', 'RC-H-W', 'RC-H-C', 'RC-H-B', 'RC-H-T', 'RC-W01']
