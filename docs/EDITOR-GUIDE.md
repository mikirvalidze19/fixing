# Product editor guide (for non-developers)

This guide is for the people who add products to the **Fixing Systems** website. You never touch code — you work in a friendly web form, and every save publishes to your GitHub repository, which automatically rebuilds and redeploys the site on **Cloudflare Pages** (~1–2 minutes later the change is live).

**ქართული შეჯამება:** პროდუქტი ემატება მარტივი ვებ-ფორმის საშუალებით — გახსენით `app.pages.cms`, შედით GitHub-ანგარიშით, დააჭირეთ „Products → Add", შეავსეთ ველები, ატვირთეთ სურათი, ჩასვით YouTube-ბმული და დააჭირეთ Publish. საიტი ავტომატურად განახლდება 1–2 წუთში. ახალი ბეჯი/ხატულა ემატება „Badges / Spec icons" განყოფილებაში და მერე ჩნდება არჩევის სიაში.

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
| Title (English) / Title (Georgian) | The product family titles. |
| Category | Where it belongs — used in the menu and catalog pages. |
| YouTube link | Paste the full `youtube.com` or `youtu.be` link (or just the video ID). |
| Product photo | Upload the product image. Tip: name the file like the ID (`hxe02.jpg`) before uploading. |
| Description (EN / KA) | Optional. If empty, the site auto-writes a summary from the price table. |
| Certifications | Tick badges (fire resistance, ETA…). Add new badges first in **Badges** (section 3). |
| Tech specs | Icon + label + value rows (e.g. Hex key / SW 13). Pick icons from **Spec icons**. |
| Standards box | Certificate rows for the right side (e.g. ETA / EAD number). |
| Documents | Name, optional size and full PDF link (hosted anywhere online). |
| Technical features | The bullet list under "Technical features". |
| Price table columns | **STEP 1 — pick these before adding variants.** Choose the columns this product's table uses from the shared **Table columns** list, in your display order. Need a column that doesn't exist yet (e.g. "Thread")? Add it once under **Table columns** in the sidebar — header text EN/KA, type (Number/Text), optionally a special use (SKU / Price / Diameter / Length) — and it becomes selectable for every product from then on. **Products without a price table simply leave this empty.** |
| Variants (prices) | **STEP 2 — the price rows. Optional** — a product without a price table leaves this empty. One row per variant printed on the price list; the whole row is ONE multiline **Values** box: type **one line per chosen column, in the same order** as the columns you picked above (standard order: SKU / Ø / Length / Units / Price / Note). Keep SKU values exactly as printed, e.g. `HX 21 08 080`. A cell that is **blank** on the price list = an **empty line** — press Enter and keep going; you may also stop early (missing end lines count as blank). |

Press **Save/Publish** → Pages CMS commits to GitHub → Cloudflare Pages publishes. Re-check the site in ~2 minutes.

## 3. Adding a new badge or spec icon (rare)

1. In the sidebar open **Badges** (or **Spec icons** / **Standards** / **Table columns**) → **Add**.
2. Enter a short lowercase **Key** (e.g. `hex-key-sw13`), a label (English / Georgian), and upload the artwork image. For **Table columns** there is no image — instead set the type (Number/Text) and, when needed, a special use (SKU/Price/Diameter/Length).
3. Publish. The item now appears automatically in every product's checkboxes/dropdowns.

No developer needed — the library is just regular content managed the same way as products.

## 4. Home page slider (slides — image or video)

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

## 5. Good to know

- **Nothing is public before you publish.** Visitors of the website can never add or edit anything; only invited collaborators can.
- Every change is a commit in GitHub history — mistakes can be reverted, and everything is attributed.
- If you remove all badges from a product, nothing crashes — the site simply shows fewer details.
- The "Description" fields are optional; with empty description the site generates a good intro from the variant/price table automatically.
- Featured products on the home page are managed under **Featured products (home page)** — pick products from the searchable list.
