# Variant table architecture (generic, CMS-driven)

Describes how the "Available variants" price table on product pages works.
Everything is defined by editors in Pages CMS — no developer touches code to
change, add or reuse table columns.

The core rule:

> **A column has no meaning in code. The product says which columns it uses,
> and every variant row stores exactly one value per chosen column.**

---

## Layer 1 — Column library (CMS section: "Table columns")

One JSON file per column (`content/table-columns/<key>.json`). Editors manage
it in Pages CMS under **Table columns** in the sidebar — same UX as Badges:

```json
{
  "key": "diametermm",
  "label": "Ø (mm)",
  "labelKa": "Ø (mm)",
  "type": "number",
  "role": "diameter"
}
```

| Field    | Meaning |
|----------|---------|
| `key`    | Unique short code. **This is the column's identity everywhere.** |
| `label` / `labelKa` | Column header text shown on the site (EN / KA). |
| `type`   | `text` (default, any string) or `number` (sortable values → powers the auto "facts" strip). |
| `role`   | Optional *feature tag*, not a data mapping: `sku` (search + variant card title), `price` (price strip, "from ₾", price range), `diameter` / `length` (auto description sentences). Leave empty for plain data columns. |

There is **no `slot` field and no fixed list of fields** — the old
sku/Ø/length/units/price/note + text1–text3 slots are gone. Editors can create
any number of columns ("Thread", "Coating", "Material grade", …) once, and
reuse them on every product. At most the tags `sku` / `price` should be used
once per product's pick if present — the first match wins.

## Layer 2 — Product table data (stored per product)

A product picks its columns and stores raw rows — the file *is* the table:

```json
{
  "id": "hxe01",
  "columns": ["sku", "diametermm", "lengthmm", "unitsperbox", "pricegel", "note"],
  "variants": [
    { "values": "HXE 01 08 080\n8\n80\n50\n1.51" }
  ]
}
```

* `columns[i]` — key from the Column library, in display order (the subset the
  editor chose for **this** product: e.g. 3 columns out of 10 in the library).
* `variants[n].values` — ONE multiline text: line *i* is the value for
  `columns[i]`, in order. An **empty line is a blank cell**, and missing
  trailing lines are blank too (the app pads short rows to the column count).
* **Why a multiline string and not a list:** Pages CMS strips null/"" items
  out of every array when it loads a file into its editor and when it saves
  (its `sanitizeObject`), which would shift every following cell of a row.
  Multiline strings survive the round trip untouched — an empty line can
  never vanish, so blank cells stay exactly where the editor typed them.
* A product **without a price table** simply has no `variants` (and no
  `columns` pick): the CMS variants list is optional and the site gates the
  variants section plus the price/count rows on `variants.length > 0`.

## Layer 3 — Normalized runtime model (`src/models/catalog.ts`)

```ts
type VariantColumn = { key; label; labelKa?; type: 'text'|'number'; role: 'sku'|'price'|'diameter'|'length'|null };
type Variant       = { cells: (number|string|null)[] };
type Product       = { …; columns: VariantColumn[]; variants: Variant[] };
```

`src/data/catalog.ts` normalizes once, at build time:

1. resolves `columns` keys against the library (unknown keys dropped, order kept);
2. splits each row's `values` text on newlines → one positional cell per line;
3. converts each cell by its column's `type` ("8" → 8 for number columns);
4. pads/trims rows to the column count (`null` where the printed cell is blank);
5. legacy support: `variantColumns` (old reference shape), positional `cells`
   arrays and named-field rows (`sku`, `diameterMm`, … — the pre-2026 files
   and the emergency seed in `tecfi-georgia-planning/data/products.json`) are
   converted to the current shape by a slot→column-key map. Only the
   *normalizer* knows legacy shapes.

## Runtime helpers (`src/utils/table.ts`)

| Helper | Purpose |
|---|---|
| `roleColumn(product, role)` | First picked column tagged with that role, or `null`. |
| `variantValue(product, variant, col)` | Raw cell value (number/string/null). |
| `variantNumber(...)` / `variantText(...)` | Typed access (`null` / "—"). |
| `columnValues(product, col)` | All values of a column (facts strip, ranges). |

## Consumers

* **Product page** — `VariantTable` / `VariantCards` render `columns × cells`
  purely generically; only visual styling keys off `role`. The section only
  renders when the product has both columns and rows — table-less products
  skip it (and the price/count rows on page and cards).
* **Facts strip** — every picked `number` column becomes a "Label: 8, 10, 12"
  fact; `price` role additionally feeds the price range.
* **Auto description** — "…offers N sizes [in category] [, diameters a–b mm]
  [, lengths a–b mm] [. Prices ₾x – ₾y per pack]" — sentences appear only when
  a matching role column exists.
* **Search** — indexes `sku`-column values plus every cell in the fallback text.
* **Cards** — "from ₾" uses the `price` column; card count = variant count.

## Migration / scripts

* `scripts/migrate-table-columns.mjs` — conversion script (idempotent):
  seeds `content/table-columns/` from the old headers, converts every
  product to the current shape (`columns` + `values` text — from legacy
  named fields or the early `cells` arrays), prints a report. Old
  `content/headers/` is removed.
* Legacy seed stays as an emergency fallback for the (never expected) case of
  an empty `content/products/` — the normalizer converts it on the fly.
