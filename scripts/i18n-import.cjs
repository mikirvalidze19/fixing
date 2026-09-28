/* Import translator-filled translations.xlsx back into src/locales/ka.json.
 * Only rows with a non-empty Georgian cell are written; the rest keep
 * falling back to English at runtime.
 * Run:  npm run i18n:import [optional path to xlsx]
 */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const ROOT = path.join(__dirname, '..');
const KA_PATH = path.join(ROOT, 'src', 'locales', 'ka.json');

function unflatten(flat) {
  const out = {};
  for (const [dotted, value] of Object.entries(flat)) {
    const parts = dotted.split('.');
    let node = out;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = value;
      } else {
        node[part] = node[part] && typeof node[part] === 'object' ? node[part] : {};
        node = node[part];
      }
    }
  }
  return out;
}

function sortDeep(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortDeep(obj[key]);
  }
  return sorted;
}

async function main() {
  const xlsxPath = process.argv[2] || path.join(ROOT, 'translations.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.getWorksheet('Translations') || wb.worksheets[0];

  const flat = {};
  let filled = 0;
  let total = 0;
  ws.eachRow((row, n) => {
    if (n === 1) return; // header
    const key = String(row.getCell(1).value ?? '').trim();
    const ka = String(row.getCell(3).value ?? '').trim();
    if (!key) return;
    total += 1;
    if (ka) {
      flat[key] = ka;
      filled += 1;
    }
  });

  fs.writeFileSync(KA_PATH, `${JSON.stringify(sortDeep(unflatten(flat)), null, 2)}\n`);
  console.log(`Wrote ${KA_PATH} — ${filled}/${total} keys translated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
