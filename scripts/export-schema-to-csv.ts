import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// XUẤT TÊN CỘT CHÍNH - FORMAT NGANG (mỗi bảng 1 dòng)
// ============================================================

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const OUTPUT_PATH = path.join(__dirname, '../scripts/schema-export.csv');

const MODEL_LABELS: Record<string, string> = {
  DSNV: 'Danh sách nhân viên',
  DMHH: 'Danh mục hàng hóa',
  PHANLOAI_HH: 'Phân loại hàng hóa',
  DONG_HH: 'Dòng hàng hóa',
  NHOM_HH: 'Nhóm hàng hóa',
  PHAN_QUYEN: 'Phân quyền',
  AUDIT_LOG: 'Nhật ký hành động',
  CD_CHUCVU: 'Từ điển chức vụ',
  CD_PHONGBAN: 'Từ điển phòng ban',
  PHANLOAI_KH: 'Phân loại khách hàng',
  NGUON_KH: 'Nguồn khách hàng',
  NHOM_KH: 'Nhóm khách hàng',
  KHTN: 'Khách hàng',
  NGUOI_GIOI_THIEU: 'Người giới thiệu',
  NGUOI_DAI_DIEN: 'Người đại diện',
  NGUOI_LIENHE: 'Người liên hệ',
  GOI_GIA: 'Gói giá',
  NCC: 'Nhà cung cấp',
  GIA_NHAP: 'Giá nhập',
  LY_DO_TU_CHOI: 'Lý do từ chối',
  DM_DICH_VU: 'Danh mục dịch vụ',
  CO_HOI: 'Cơ hội',
  GIA_BAN: 'Giá bán',
  LOAI_CHAM_SOC: 'Loại chăm sóc',
  KET_QUA_CS: 'Kết quả chăm sóc',
  KEHOACH_CSKH: 'Kế hoạch chăm sóc khách hàng',
  CD_LOAI_CONG_TRINH: 'Từ điển loại công trình',
  CD_NHOM_KS: 'Từ điển nhóm khảo sát',
  HANG_MUC_KS: 'Hạng mục khảo sát',
};

// Chỉ lấy field có kiểu Prisma cơ bản (bỏ relation, bỏ array ngược)
const BASIC_TYPES = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes']);

interface TableRow {
  modelName: string;
  tableName: string;
  columns: string[];
}

function parseSchema(content: string): TableRow[] {
  const tables: TableRow[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;

  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    const tableName = MODEL_LABELS[modelName] || modelName;
    const columns: string[] = [];

    for (const line of modelBody.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

      const fieldMatch = trimmed.match(/^(\w+)\s+([\w\[\]?!]+)/);
      if (!fieldMatch) continue;

      const [, fieldName, rawType] = fieldMatch;
      const baseType = rawType.replace(/[\[\]?!]/g, '');

      // Chỉ lấy các cột dữ liệu thật (bỏ relation field)
      if (!BASIC_TYPES.has(baseType)) continue;

      columns.push(fieldName);
    }

    if (columns.length > 0) {
      tables.push({ modelName, tableName, columns });
    }
  }

  return tables;
}

function toCsv(tables: TableRow[]): string {
  const BOM = '\uFEFF'; // UTF-8 BOM để Google Sheet đọc tiếng Việt đúng
  const maxCols = Math.max(...tables.map(t => t.columns.length));
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;

  // Header: Tên bảng (DB) | Tên bảng (VN) | Cột 1 | Cột 2 | ...
  const header = [
    'Tên bảng (DB)',
    'Tên bảng (VN)',
    ...Array.from({ length: maxCols }, (_, i) => `Cột ${i + 1}`),
  ].join(',');

  const rows = tables.map(t => {
    const cells = [escape(t.modelName), escape(t.tableName), ...t.columns.map(escape)];
    // Padding cho các bảng ít cột hơn
    while (cells.length < maxCols + 2) cells.push('""');
    return cells.join(',');
  });

  return BOM + [header, ...rows].join('\n');
}

// ============================================================
// MAIN
// ============================================================
const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
const tables = parseSchema(schemaContent);
const csv = toCsv(tables);

fs.writeFileSync(OUTPUT_PATH, csv, 'utf-8');

console.log(`✅ Xuất thành công ${tables.length} bảng`);
console.log(`📁 File: ${OUTPUT_PATH}`);
console.log('\n📊 Chi tiết:');
for (const t of tables) {
  console.log(`  ${t.modelName.padEnd(24)} (${t.tableName}): ${t.columns.length} cột`);
  console.log(`    → ${t.columns.join(', ')}`);
}
