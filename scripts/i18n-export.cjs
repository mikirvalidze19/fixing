/* Export src/locales/en.json (+ existing ka values) to translations.xlsx.
 * Send the xlsx to the translator: they fill the Georgian column.
 * Run:  npm run i18n:export
 * Back:  npm run i18n:import   (reads translations.xlsx → src/locales/ka.json)
 */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const ROOT = path.join(__dirname, '..');
const EN_PATH = path.join(ROOT, 'src', 'locales', 'en.json');
const KA_PATH = path.join(ROOT, 'src', 'locales', 'ka.json');
const OUT_PATH = path.join(ROOT, 'translations.xlsx');

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, full, out);
    } else {
      out[full] = String(value);
    }
  }
  return out;
}

async function main() {
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  let ka = {};
  try {
    ka = JSON.parse(fs.readFileSync(KA_PATH, 'utf8'));
  } catch {
    /* no translations yet */
  }
  const enFlat = flatten(en);
  const kaFlat = flatten(ka);
  const keys = Object.keys(enFlat).sort();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'fixing-app';
  wb.created = new Date();
  const ws = wb.addWorksheet('Translations');

  ws.columns = [
    { header: 'Key (do not edit)', key: 'key', width: 44 },
    { header: 'English (source — do not edit)', key: 'en', width: 80 },
    { header: 'Georgian (translator fills this)', key: 'ka', width: 80 },
    { header: 'Section', key: 'section', width: 18 },
  ];

  for (const key of keys) {
    ws.addRow({
      key,
      en: enFlat[key],
      ka: kaFlat[key] ?? '',
      section: key.split('.')[0],
    });
  }

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E5F' } };
  header.alignment = { vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = 'A1:D1';
  // Widen rows for long copy; translator can adjust.
  ws.eachRow((row, n) => {
    if (n === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
  });
  // Lock everything except the Georgian column (C).
  ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
  }).catch(() => {});
  ws.eachRow((row, n) => {
    if (n === 1) return;
    row.getCell('C').protection = { locked: false };
  });

  await wb.xlsx.writeFile(OUT_PATH);
  console.log(`Wrote ${OUT_PATH} — ${keys.length} keys.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
