# Product editor guide (for non-developers)

This guide is for the people who add products to the **Fixing Systems** website. You never touch code — you work in a friendly web form, and every save publishes to your GitHub repository, which automatically rebuilds and redeploys the site on **Cloudflare Pages** (~1–2 minutes later the change is live).

**ქართული შეჯამება:** პროდუქტი ემატება მარტივი ვებ-ფორმის საშუალებით — გახსენით `app.pages.cms`, შედით GitHub-ანგარიშით, დააჭირეთ „Products → Add", შეავსეთ ველები, ატვირთეთ სურათი, ჩასვით YouTube-ბმული და დააჭირეთ Publish. საიტი ავტომატურად განახლდება 1–2 წუთში. ახალი ბეჯი/ხატულა ემატება „Badges / Spec icons" განყოფილებაში და მერე ჩნდება არჩევის სიაში.

5. **ქართული შეჯამება (ფასების განახლება):** გახსენით „Price updater (bulk %)", ჩაწერეთ პროცენტი (მაგ. 10), აირჩიეთ მიმართულება (გაზრდა/შემცირება) და პროდუქტები (ან „Apply to ALL"), დააჭირეთ Save. ~1-2 წუთში ყველა არჩეული პროდუქტის საფასო ცხრილის ფასები განახლდება და ფორმა ავტომატურად ჩამოყალიბდება თავიდან (ხელახალი შენახვა არაფერს შეცვლის).

6. **ქართული შეჯამება (გამოყენების გვერდები):** „Applications" განყოფილებაში ემატება სადაც პროდუქტი გამოიყენება (Roofing, Solar panels…). პროდუქტზე გახსნისას აირჩიეთ ველში Applications, თუ რომელ გამოყენების გვერდებზე უნდა გამოჩნდეს — გვერდი ავტომატურად ჩამოთვლის პროდუქტებს.

7. **ქართული შეჯამება (კატეგორიები):** „Catalog categories" განყოფილებაში მართეთ /products კატეგორიების გვერდები — ინგლისურ-ქართული სახელი და აღწერა, მენიუში სურათი და რიგის ნომერი. პროდუქტს Category ველიდან აირჩევს კატეგორიას.

---

## 1. One-time setup (done once by the owner)

1. Push/publish this repository's changes so the config file (`.pages.yml`) is on GitHub.
2. Open **https://app.pagescms.org** in a browser and sign in with GitHub.
3. Pick the repository (`mikirvalidze19/fixing`) — the editor screens appear automatically from `.pages.yml`.
4. Invite each editor as a collaborator on the GitHub repo (Settings → Collaborators). Only invited people can edit anything.

You can also just open **`https://yoursite.com/admin`** — it redirects to the editor for this repository.

## 2. Adding a new product

Open the editor → **Products** → **Add** and fill the form:

| Field | What to enter |
|---|---|
| ID | Short lowercase code, unique — e.g. `hxe02`. Becomes the page address. |
| Series code | As printed on the price list, e.g. `HXE02`. |
| Catalog order | Optional number — lower = earlier in the catalog lists (existing products use 1–28). Empty = end of the list. |
| Title (English) / Title (Georgian) | The product family titles. |
| Category | Where it belongs — used in the menu and catalog pages. Managed under **Catalog categories** in the sidebar (section 3). |
| Applications | Where the product is USED — multi-select (Roofing, Fire resistance, Solar panels…). The matching `/applications/<id>` pages then list the product automatically; leave empty for none. See section 6. |
| YouTube link | Paste the full `youtube.com` or `youtu.be` link (or just the video ID). |
| Product photo | Upload the product image. Tip: name the file like the ID (`hxe02.jpg`) before uploading. |
| Description (EN / KA) | Optional. If empty, the site auto-writes a summary from the price table. |
| Certifications | Tick badges (fire resistance, ETA…). Add new badges first in **Badges** (section 4). |
| Tech specs | Icon + label + value rows (e.g. Hex key / SW 13). Pick icons from **Spec icons**. |
| Standards box | Certificate rows for the right side (e.g. ETA / EAD number). |
| Documents | Name, optional size and full PDF link (hosted anywhere online). |
| Technical features | The bullet list under "Technical features". |
| Price table columns | **STEP 1 — pick these before adding variants.** Choose the columns this product's table uses from the shared **Table columns** list, in your display order. Need a column that doesn't exist yet (e.g. "Thread")? Add it once under **Table columns** in the sidebar — header text EN/KA, type (Number/Text), optionally a special use (SKU / Price / Diameter / Length) — and it becomes selectable for every product from then on. **Products without a price table simply leave this empty.** |
| Variants (prices) | **STEP 2 — the price rows. Optional** — a product without a price table leaves this empty. One row per variant printed on the price list; the whole row is ONE multiline **Values** box: type **one line per chosen column, in the same order** as the columns you picked above (standard order: SKU / Ø / Length / Units / Price / Note). Keep SKU values exactly as printed, e.g. `HX 21 08 080`. A cell that is **blank** on the price list = an **empty line** — press Enter and keep going; you may also stop early (missing end lines count as blank). |

Press **Save/Publish** → Pages CMS commits to GitHub → Cloudflare Pages publishes. Re-check the site in ~2 minutes.

## 3. Catalog categories (the Products menu + category pages)

The **Catalog categories** sidebar section manages the 15 section pages under `/products/<slug>` and the icons in the **Products** menu. Each category is one row:

| Field | What to enter |
|---|---|
| ID (slug) | The page address (`/products/roofing-fixing-systems`). **Never rename it** — every product points at this exact value. |
| Menu order | Display position (1 = first); empty numbers come last. |
| Name / Description (EN / KA) | Texts on the category page and in the menu; missing Georgian falls back to English. |
| Icon image | The small tile picture used in the Products menu (roughly square works best). |

Products pick their category from the live list (the product's **Category** field), and new categories added here appear in every product's picker + the site menu automatically. Georgian texts can now be filled per category — previously these were English-only.

## 4. Adding a new badge or spec icon (rare)

1. In the sidebar open **Badges** (or **Spec icons** / **Standards** / **Table columns**) → **Add**.
2. Enter a short lowercase **Key** (e.g. `hex-key-sw13`), a label (English / Georgian), and upload the artwork image. For **Table columns** there is no image — instead set the type (Number/Text) and, when needed, a special use (SKU/Price/Diameter/Length).
3. Publish. The item now appears automatically in every product's checkboxes/dropdowns.

No developer needed — the library is just regular content managed the same way as products.

## 5. Home page slider (slides — image or video)

Open the editor → **Home slider** → the **Slides** field. Each slide is one card; click **Add an item** and pick its type, then fill the fields of that type:

- **Image slide** — upload the **Background image** (a wide photo works best, e.g. 1920×1080 webp), optionally an **Extra overlay image** (art layered on the right side), then Title / Text in English and Georgian.
- **Video slide** — upload the **Video file** (MP4/WebM, up to ~25 MB per file) OR paste a **Video URL** for an externally hosted MP4 (the upload wins if both are set), optionally a **Poster image** (still frame shown while loading), then the same Title / Text fields.

| Field | Rule |
|---|---|
| Button text (EN / KA) | Optional. **No text → no button on that slide** (per language). |
| Button link | Where the button goes, e.g. `/products/roofing-fixing-systems` or `/video`. Empty link opens the product catalog (`/products`). |
| Look variant | Optional colour accent for image slides (Heavy-duty / Chemical / Fasteners / Drywall); leave on the default look unless told otherwise. |
| Rotation speed | Optional — milliseconds a slide stays up (6000 = 6 s). |

Drag the slide cards to reorder (top = first on the site). Press **Save/Publish** → the home page updates in ~2 minutes.

## 6. Applications (usage pages — where products are used)

The **Applications** sidebar section manages the cards on `/applications` (Roofing, Fire resistance, Solar panels, HVAC…). Each application is one row; click it to edit:

| Field | What to enter |
|---|---|
| ID (slug) | The page address (`/applications/roofing`). **Never rename it** once products point to it. |
| Order | Card position on the Applications page (1 = first). |
| Name / Description (EN / KA) | Texts; missing Georgian falls back to English. |
| Card image | Upload the tile photo (a wide webp/jpg works best). |

**Important — an application does NOT have its own product list.** Instead, every product picks which applications it belongs to (the applications mirror the real product usage on tecfi.it, where one application can contain products from several categories):

1. Open the **product** in the CMS.
2. In the **Applications** field (right under Category) search and select **every application that applies** — e.g. HXE01 goes to Roofing, Fire resistance, Solar panels, HVAС and so on. Remove a selected chip to un-tag.
3. Save → the `/applications/<id>` page automatically lists the product (in catalog order).

Adding a **new application** works the same as products: **Applications → Add**, set the ID/Name/Description/Order, upload the image, save — the new card appears on the site, and it fills up with products as you tag them in the products' Applications field.

## 7. Updating prices in bulk (by percent)

Open the editor → **Price updater (bulk %)** → fill the form and press **Save/Publish**:

| Field | What it does |
|---|---|
| **Change by percent (%)** | Plain number: `10` = ±10%, `2.5` = ±2.5%. |
| **Direction** | **Increase prices (+)** or **Decrease prices (−)**. |
| **Apply to ALL products** | ON → every price cell of every product's table is updated. |
| **Products** | When ALL is off — search and pick **one or several** products (click a chip to remove it). |

About 1 minute after you save, an automatic helper rewrites **every price cell of the chosen products' tables** (all rows — if a table has 10 rows, all 10 prices move) and the site rebuilds. What happens per cell:

- Blank price cells, dashes and text cells are left exactly as they are.
- Results are rounded to 2 decimals (e.g. `25` +10% → `27.5`).
- A price never drops below `0.01` even with a huge decrease.

**Cheap safety:** after the update the form resets itself (percent → 0, picks cleared). Re-saving the same form does **not** double-apply — it only does something when you type a percent above 0 and pick products again. If you change your mind *before* the update finishes, contact the owner (within ~1 minute the job may already be running).

**Verify it worked:** open the product in the CMS ~2 minutes later and check the table, or look at the repository's **Actions** tab — the "Price update" run shows a summary like `+10% applied to 3 products (7 price cells)`.

## 8. Good to know

- **Nothing is public before you publish.** Visitors of the website can never add or edit anything; only invited collaborators can.
- Every change is a commit in GitHub history — mistakes can be reverted, and everything is attributed.
- If you remove all badges from a product, nothing crashes — the site simply shows fewer details.
- The "Description" fields are optional; with empty description the site generates a good intro from the variant/price table automatically.
- Featured products on the home page are managed under **Featured products (home page)** — pick products from the searchable list.
