# Testing guide — local dev + CMS test flow

Run everything from the project folder: `C:\Users\pc\Desktop\test2\test2`
(Commands work in **cmd** and PowerShell.)

```
cd C:\Users\pc\Desktop\test2\test2
```

---

## Level 1 — Start the site locally (no GitHub needed)

```
npm install        (only once, already done on this machine)
npm run dev
```

Open the printed address (usually **http://localhost:5173**) and check:

- Home page loads with featured products (hxe01, AJE, ZZE, chemical anchors)
- Header ▸ Products menu lists all 16 categories
- Open category **Heavy duty metallic** — product cards show photos + spec icons
- Open product **HXE01** — right-side standards box (ETA/seismic/fire), spec icon under the title, price table, documents, YouTube video at the bottom
- Header search: type `HX` — results appear; click through
- `http://localhost:5173/admin` — redirects to the Pages CMS editor page

Stop the server with **Ctrl + C**.

---

## Level 2 — Simulate "add product" (offline, no CMS, instant)

This shows exactly how the CMS will store an editor's work:

1. Create a new file `content/products/test-01.json` — minimal example:

```json
{
  "id": "test-01",
  "series": "TEST-01",
  "titleEn": "Test product (delete me)",
  "titleKa": "საცდელი პროდუქტი (წაშალე)",
  "category": "general-fasteners",
  "youtube": "https://youtu.be/DA2M-kUpvIo",
  "image": "/content/images/products/test-01.jpg",
  "descriptionEn": "",
  "descriptionKa": "",
  "groupNumber": 999,
  "certifications": ["logo-simbolo-eta"],
  "specs": [
    { "icon": "chiaveesagonale", "label": "Across flat", "value": "SW 13" }
  ],
  "standards": [],
  "documents": [],
  "features": [],
  "columns": ["sku", "pricegel"],
  "variants": [
    {
      "values": "TST 01 10 100\n2.50"
    }
  ]
}
```

This is the **"pick columns first, then values" flow**: `columns` lists the
keys of the Table columns the product uses, in display order, and each
variant row is one `values` multiline string — **one line per column, in
the same order**. Two picked columns → two lines; six picked columns → six
lines. A cell that is blank on the price list is an **empty line** (the CMS
strips empty entries out of real arrays, which would misalign the row — a
multiline string is safe). You may also stop early: the site pads missing
trailing lines with blanks. Legacy rows (`"cells": [...]` arrays or named
fields like `"sku": "…"`) are converted by the normalizer /
`npm run migrate:table` and should not be used in new files.

2. Copy any product photo to `content/images/products/test-01.jpg`
   (any .jpg/.png/.webp works — the CMS will do this upload for the editor).
3. **Restart the dev server** (Ctrl + C → `npm run dev`) so it re-scans the folder.
4. Open `http://localhost:5173/product/test-01` — you should see the same look
   as a real product: photo, ETA badge, spec icon, price, video. It also
   appears at the end of the **General fasteners** category and in search.
5. Clean up: delete the two test files → restart the dev server again.

That manual file + image is **exactly** what the CMS form will produce with one click.

---

## Level 3 — Test the real CMS end-to-end (needs GitHub)

First make sure this setup is on GitHub (one-time):

```
git add .
git commit -m "feat: add Pages CMS product-adding setup"
git push
```

Cloudflare Pages deploys automatically as on any push.

Then:

1. Open **https://app.pagescms.org** (or `http://localhost:5173/admin` — the redirect) and log in with GitHub.
2. Select the repository `mikirvalidze19/fixing` → branch `main`.
   The sidebar shows **Products**, **Badges**, **Spec icons**, **Standards**, **Table columns**, **Featured products** — generated from `.pages.yml`.
3. **Products → Add product "TEST-02"**, upload an image, paste a YouTube link, tick a badge, add one variant row → **Save/Publish**.
4. After ~2 minutes the product is visible on the live Cloudflare Pages site.
5. Locally: `git pull` → restart `npm run dev` → same product on localhost. ✔
6. Delete TEST-02 in the CMS when done (also just a commit).

> The hosted CMS writes to GitHub, not to your disk — that is why step 5 needs
> `git pull`. Editors don't run anything locally; for them only steps 1–4 exist.

---

## Optional extras

- **Production-like local preview:** `npm run build` then `npm run preview` —
  this runs the exact optimized bundle Cloudflare will serve.
- Running the CMS app **itself** on your machine is possible but needs
  PostgreSQL (Docker) + a GitHub App — heavy developer machinery, not needed:
  use app.pagescms.org instead.
- Lint check: `npm run lint`. Full type + build check: `npm run build`.
