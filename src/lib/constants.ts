/**
 * Hằng số dùng chung cho backend và giao diện.
 * Nguồn: bản yêu cầu website v0.1 (mục 3, 9, 14).
 */

export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

/** Vai trò nội bộ — khớp ma trận mục 3 blueprint và QC-PQ-01. */
export const ROLES = [
  { value: 'director', label: { vi: 'Giám đốc', en: 'Director' } },
  { value: 'marketing', label: { vi: 'Quản lý marketing', en: 'Marketing manager' } },
  { value: 'sales', label: { vi: 'Sales', en: 'Sales' } },
  { value: 'editor', label: { vi: 'Biên tập', en: 'Editor' } },
  { value: 'legal', label: { vi: 'Pháp chế – tuân thủ', en: 'Legal & compliance' } },
  { value: 'tech', label: { vi: 'Quản trị kỹ thuật', en: 'Technical admin' } },
] as const
export type Role = (typeof ROLES)[number]['value']

export const SALE_STATUSES = [
  { value: 'draft', label: { vi: 'Nháp', en: 'Draft' } },
  { value: 'coming_soon', label: { vi: 'Sắp ra mắt', en: 'Coming soon' } },
  { value: 'on_sale', label: { vi: 'Đang bán', en: 'On sale' } },
  { value: 'discontinued', label: { vi: 'Ngừng kinh doanh', en: 'Discontinued' } },
] as const
export type SaleStatus = (typeof SALE_STATUSES)[number]['value']

/** Thang ba cấp về tái chế (bộ nhận diện RENCO). */
export const CLAIM_LEVELS = [
  { value: 'none', label: { vi: 'Không ghi', en: 'None' } },
  { value: 'level1_factory', label: { vi: 'Cấp 1 · thông tin nhà máy', en: 'Level 1 · factory information' } },
  { value: 'level2_product', label: { vi: 'Cấp 2 · tỉ lệ trong sản phẩm', en: 'Level 2 · content in product' } },
  { value: 'level3_certified', label: { vi: 'Cấp 3 · có chứng nhận GRS/RCS', en: 'Level 3 · GRS/RCS certified' } },
] as const
export type ClaimLevel = (typeof CLAIM_LEVELS)[number]['value']

export const SPEC_STATUSES = [
  { value: 'proposed', label: { vi: 'Đề xuất (chưa hiện công khai)', en: 'Proposed (hidden publicly)' } },
  { value: 'factory_confirmed', label: { vi: 'Nhà máy đã xác nhận', en: 'Confirmed by factory' } },
] as const

/** Kiểu bảng quy cách của sản phẩm — theo cách trình bày của Catalog RENCO 2026 v3.0. */
export const SPEC_TEMPLATES = [
  { value: 'pressure_pipe', label: { vi: 'Ống cấp nước (bảng dn × dãy S)', en: 'Pressure pipe (dn × S series)' } },
  { value: 'drain_pipe', label: { vi: 'Ống thoát nước (bảng dn × Class A/B)', en: 'Drainage pipe (dn × class A/B)' } },
  { value: 'fitting', label: { vi: 'Phụ kiện (mã + tên, không số đo)', en: 'Fittings (code + name, no dimensions)' } },
  { value: 'hose', label: { vi: 'Ống mềm (Ø trong, Ø ngoài, dài cuộn, kg/cuộn)', en: 'Hose (ID, OD, coil, kg/coil)' } },
  { value: 'gutter_liner', label: { vi: 'Tấm lót (dài và khổ kết hợp tự do)', en: 'Liner (length and width combined freely)' } },
  { value: 'sheet', label: { vi: 'Tấm (dài × rộng)', en: 'Sheet (length × width)' } },
  { value: 'panel', label: { vi: 'Tấm (dài × rộng × dày)', en: 'Panel (length × width × thickness)' } },
] as const
export type SpecTemplate = (typeof SPEC_TEMPLATES)[number]['value']

export const LEAD_TYPES = [
  { value: 'distributor', label: { vi: 'Nhà phân phối', en: 'Distributor' } },
  { value: 'retailer', label: { vi: 'Cửa hàng', en: 'Retail store' } },
  { value: 'contractor', label: { vi: 'Đơn vị thi công', en: 'Contractor' } },
  { value: 'sample', label: { vi: 'Bộ mẫu', en: 'Sample kit' } },
  { value: 'contact', label: { vi: 'Liên hệ chung', en: 'General contact' } },
] as const
export type LeadType = (typeof LEAD_TYPES)[number]['value']

export const LEAD_STATUSES = [
  { value: 'new', label: { vi: 'Mới', en: 'New' } },
  { value: 'contacted', label: { vi: 'Đã liên hệ', en: 'Contacted' } },
  { value: 'qualified', label: { vi: 'Đủ điều kiện', en: 'Qualified' } },
  { value: 'sample_sent', label: { vi: 'Đã gửi mẫu', en: 'Sample sent' } },
  { value: 'proposal_sent', label: { vi: 'Đã gửi chính sách / báo giá', en: 'Policy / quote sent' } },
  { value: 'won', label: { vi: 'Thành đối tác', en: 'Won' } },
  { value: 'lost', label: { vi: 'Không thành', en: 'Lost' } },
  { value: 'unqualified', label: { vi: 'Không phù hợp', en: 'Unqualified' } },
  { value: 'duplicate', label: { vi: 'Trùng', en: 'Duplicate' } },
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]['value']

/** Vòng đời lead (mục 5.3). Chuyển trạng thái ngoài bảng này trả lỗi 409. */
export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'unqualified', 'duplicate'],
  contacted: ['qualified', 'sample_sent', 'unqualified', 'duplicate'],
  qualified: ['sample_sent', 'proposal_sent', 'lost'],
  sample_sent: ['proposal_sent', 'won', 'lost'],
  proposal_sent: ['won', 'lost'],
  won: [],
  lost: [],
  unqualified: [],
  duplicate: [],
}

export const LOST_REASONS = [
  { value: 'price', label: { vi: 'Giá', en: 'Price' } },
  { value: 'no_need', label: { vi: 'Chưa có nhu cầu', en: 'No current need' } },
  { value: 'competitor', label: { vi: 'Chọn nhà cung cấp khác', en: 'Chose another supplier' } },
  { value: 'conditions', label: { vi: 'Không đáp ứng điều kiện kênh', en: 'Did not meet channel conditions' } },
  { value: 'no_response', label: { vi: 'Không liên lạc được', en: 'Unreachable' } },
  { value: 'other', label: { vi: 'Khác', en: 'Other' } },
] as const

export const VOLUME_BANDS = [
  { value: 'lt100m', label: { vi: 'Dưới 100 triệu đồng', en: 'Under VND 100 million' } },
  { value: '100to500m', label: { vi: '100 – 500 triệu đồng', en: 'VND 100 – 500 million' } },
  { value: 'gt500m', label: { vi: 'Trên 500 triệu đồng', en: 'Over VND 500 million' } },
  { value: 'unknown', label: { vi: 'Chưa xác định', en: 'Not sure yet' } },
] as const

/** Bộ mẫu (sample kit v1.2). */
export const SAMPLE_KITS = [
  { value: 'board_hose_water', label: { vi: 'Bảng mẫu ống mềm dẫn nước và trong suốt (RC-H01 – H07)', en: 'Water and clear hose board (RC-H01 – H07)' } },
  { value: 'board_hose_technical', label: { vi: 'Bảng mẫu ống mềm lưới dệt và kỹ thuật (RC-H08 – H13)', en: 'Braided and technical hose board (RC-H08 – H13)' } },
  { value: 'board_roofing', label: { vi: 'Bảng mẫu tấm lợp (RC-R01)', en: 'Roofing sheet board (RC-R01)' } },
  { value: 'board_wall', label: { vi: 'Bảng mẫu tấm ốp tường (RC-W01)', en: 'Wall panel board (RC-W01)' } },
  { value: 'book', label: { vi: 'Quyển mẫu gấp hai bìa', en: 'Folding sample book' } },
] as const

export const DATA_REQUEST_KINDS = [
  { value: 'access', label: { vi: 'Xem dữ liệu của tôi', en: 'Access my data' } },
  { value: 'rectify', label: { vi: 'Sửa dữ liệu', en: 'Correct my data' } },
  { value: 'erase', label: { vi: 'Xoá dữ liệu', en: 'Erase my data' } },
  { value: 'withdraw', label: { vi: 'Rút lại đồng ý', en: 'Withdraw consent' } },
] as const

export const DOCUMENT_KINDS = [
  { value: 'catalog', label: { vi: 'Catalog', en: 'Catalog' } },
  { value: 'profile', label: { vi: 'Hồ sơ năng lực', en: 'Company profile' } },
  { value: 'datasheet', label: { vi: 'Tờ thông số', en: 'Datasheet' } },
  { value: 'standard', label: { vi: 'Tiêu chuẩn cơ sở', en: 'Company standard' } },
  { value: 'test_report', label: { vi: 'Phiếu thử nghiệm', en: 'Test report' } },
  { value: 'certificate', label: { vi: 'Giấy chứng nhận', en: 'Certificate' } },
  { value: 'material_balance', label: { vi: 'Phiếu cân đối nguyên liệu', en: 'Material balance record' } },
  { value: 'other', label: { vi: 'Khác', en: 'Other' } },
] as const

/** 34 tỉnh, thành phố hiện hành (từ 01/7/2025). */
export const PROVINCES = [
  'Hà Nội', 'Huế', 'Hải Phòng', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Cần Thơ',
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai',
  'Đồng Tháp', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lâm Đồng',
  'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long',
] as const

/** Mã dòng ống uPVC — chịu quy tắc BR-01, BR-02. */
export const PIPE_LINE_CODE = 'RC-P'

/** Câu chuẩn về tái chế — chỉ dùng đúng câu này (bộ nhận diện, sample kit). */
export const FACTORY_RECYCLING_STATEMENT = {
  vi: 'Nhà máy REN Group tái chế khoảng 750 tấn nhựa mỗi tháng (nguồn: hồ sơ năng lực PT Dunia Plast Indonesia 2026).',
  en: 'The REN Group factory recycles about 750 tonnes of plastic a month (source: PT Dunia Plast Indonesia company profile 2026).',
}

export const options = <T extends { value: string; label: { vi: string; en: string } }>(
  list: readonly T[],
) => list.map((o) => ({ value: o.value, label: { vi: o.label.vi, en: o.label.en } }))
