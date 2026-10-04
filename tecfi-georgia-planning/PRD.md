# Fixing Systems Georgia catalog website - product requirements document

## 1. Product summary

Build a fast, responsive, front-end-only catalog website for **Fixing Systems** (the Georgia-based importer) using the supplied product range. The experience should closely follow Tecfi's public English website in information architecture, interaction patterns, hierarchy, and industrial visual tone, but must use Fixing Systems' own logo, contact details, Georgian-language copy, and authorized assets.

This is a catalogue and enquiry website, not an e-commerce checkout. All currently available product data lives in `data/products.json`; a future Supabase integration can replace the static data adapter without changing the UI.

Reference reviewed: [Tecfi English home page](https://www.tecfi.it/en), [Applications](https://www.tecfi.it/en/applications), and [Services & support](https://www.tecfi.it/en/services-and-support).

### Guardrail

Do not copy Tecfi source code, photography, downloadable documents, text, logos, or trademark treatment without written permission. “Same website” should mean equivalent page structure and interaction design, adapted into Fixing Systems branding and content. Product names, certifications, technical claims, photos, and documents must be confirmed as authorized for local publication.

## 2. Goals and scope

### Goals

- Help Georgian contractors and trade buyers locate a suitable imported fixing product quickly.
- Make every available SKU searchable and show its exact printed price in GEL.
- Present the importer as an authorized, technically competent local partner.
- Enable a no-backend launch: editing one JSON file is enough to change product data and prices.
- Match Tecfi's recognizable desktop/mobile content flow: promotional hero, product finder, featured cards, catalogue detail pages, applications, support, company/contact information.

### Out of scope for v1

- Login, cart, checkout, payment, live inventory, order history, or an admin dashboard.
- Automatic currency, price, availability, or document updates.
- A claim that every Tecfi product is locally available. Only products in the JSON dataset are available in v1.

## 3. Users

- **Contractor / installer:** searches by SKU or filters by material and use case.
- **Technical buyer:** checks dimensions, pack quantity, price, certifications, and local contact details.
- **Architect / engineer:** browses application solutions and requests technical documentation.
- **Fixing Systems editor:** changes `data/products.json`, images, and static content in a code repository.

## 4. Content and data model

The seed catalogue contains **28 product families and 99 SKU rows**, parsed from the supplied six-page price list. The dataset preserves source prices as numbers in GEL; `null` means the PDF did not provide a corresponding dimension.

Each product variant is a self-describing object with `sku`, `diameterMm`, `lengthMm`, `unitsPerBox`, `priceGel`, and `note` fields. `null` means the PDF did not state that field. Persist the source SKU exactly as written, including spaces. The source price is a price per displayed unit/pack as printed; because the source does not state VAT status, show no VAT label until the business confirms it.

Recommended additions before launch:

- `slug`, `category`, `applications`, `image`, `gallery`, `datasheetUrl`, and `availability` per family.
- Full Georgian and English descriptions, reviewed by the importer.
- A `lastUpdated` date and an optional `priceVisible` switch.
- Alt text for every product image and an explicit `priceDisclaimerKa`.

## 5. Site map

```text
/
├── /products
│   ├── /products/:category
│   └── /products/:product-slug
├── /applications
│   └── /applications/:application-slug
├── /services-and-support
├── /company
├── /news                 (optional at launch; hide if empty)
└── /contacts
```

The header needs a compact utility row with language selector, Contact link, and search. The main navigation follows Tecfi's observed sections: Products, Applications, Video (optional), Services & support, and Company. The footer repeats contact information, support/navigation links, map link, certifications, copyright, and legal links.

## 6. Page requirements

### Home

1. Sticky header: logo, primary navigation, language switcher (KA first, EN optional), search icon/field, prominent contact action.
2. Full-width rotating hero/slider with 3-5 locally relevant campaigns. Each slide has an image, a concise headline, short supporting copy, and “View products”.
3. “Find the right product” module modeled on Tecfi's category + application finder. In v1, it filters local JSON data; unavailable filters are not shown.
4. Featured products: 4-8 cards selected via a static `featured` flag. Card shows image, product title, series, and detail link.
5. Value/statements band: local rather than Tecfi's global corporate counts (for example “Official importer in Georgia”, “Technical support”, “Fast local response”). Do not invent statistics.
6. Application tiles, support CTA, and contact CTA.

### Products index

- Title, short introduction, category chips/sidebar, and a responsive grid of product-family cards.
- Search matches series, SKU, Georgian title, English title, standards, certifications, and notes.
- Filters: category, application, certification, diameter/length where data exists, and price range.
- On desktop, keep filters at left and results at right. On mobile, use a filter drawer.
- Result counts update live and the URL carries filter state for sharing.
- An empty state offers “Clear filters” and a contact option.

### Product detail

- Breadcrumb, product image/gallery, Georgian family title, English/series identifier, technical description, certificates/standards, and application tags.
- SKU table with columns: SKU, diameter (mm), length (mm), units per box, price (GEL), note. Handle missing measurements with an em dash, not `null`.
- Table is horizontally scrollable on narrow screens and sortable on desktop.
- “Request price / technical help” CTA opens a mailto link or a pre-filled contact form that does not require a backend (Formspree or equivalent only after the business chooses it).
- Related local products and related applications.

### Applications

Use the grid pattern observed on Tecfi: large photographic/illustrative tiles with a short title. Start only with applications supported by the local assortment, such as concrete fixing, thermal insulation, roofing, metal carpentry, and chemical anchoring. Each application page states the recommended local series, with a disclaimer that final design/specification decisions require professional review.

### Services & support

Recreate the simple Tecfi-style support hub: Assistance & information, Downloads, Terms of sale, and Chemical fixing calculation. Initially, downloads and calculator links may be “coming soon,” but they must not imitate a functional feature. Add local telephone and email prominently.

### Company and contacts

Use the supplied importer details:

- Address: თბილისი, ქართულ ამერიკული მეგობრობის ქ. N33 (ამერიკის საელჩოს მიმდებარედ)
- Phones:  +995 511 42-55-11
- Email: info.fs.ge@gmail.com

Include a map link/embed only once the exact public location and privacy requirements are approved.

## 7. Visual and interaction direction

- Preserve Tecfi's editorial hierarchy: ample white space, full-bleed hero imagery, crisp card grids, bold product series labels, technical tabular data, and a dense but readable footer.
- Use Fixing Systems' existing dark-gray/yellow identity from the supplied catalog as the local brand palette. Do not reuse Tecfi's logo or visual assets.
- Use clean sans-serif typography, high contrast, consistent 8px spacing scale, rounded focus-visible outlines, and restrained motion.
- Desktop breakpoint target: 1024px; tablet: 768px; mobile: 375px. All product table content remains reachable on mobile.
- Support keyboard navigation, visible focus, semantic headings, labelled inputs, 44px touch targets, descriptive image alt text, and WCAG 2.2 AA contrast.

## 8. Technical architecture

- Recommended: React + Vite + TypeScript, React Router, static JSON import, CSS modules or Tailwind, deployed on Netlify/Vercel/Cloudflare Pages.
- Keep `src/data/catalog.ts` as the only adapter between UI and `data/products.json`.
- Use static images optimized to AVIF/WebP with an appropriate JPEG/PNG fallback; lazy-load non-hero images.
- Generate a static `sitemap.xml`, `robots.txt`, and social preview image.
- Implement `Organization`, `LocalBusiness`, `Product`, `Offer`, and breadcrumb JSON-LD only for verified data. Do not mark unspecified stock as in-stock.
- Analytics/cookie banner is deferred until the business selects a provider and legal text.

## 9. Acceptance criteria

- Every one of the 99 JSON SKU rows is rendered by the product UI and searchable by SKU.
- Prices render as GEL with two decimal places (for example `₾2.60`) and no altered numeric values.
- Editing a JSON price, variant, or title changes the displayed result without any backend.
- Navigation, product search/filtering, product detail routes, CTA links, contact links, and responsive menu work at 375px, 768px, and 1440px.
- No Tecfi logo, copyrighted imagery, or copied source text is shipped unless a license is supplied.
- Lighthouse targets: Performance 90+, Accessibility 95+, Best Practices 90+, SEO 90+ on the home page under a production build.
- The site has no broken links and the complete catalogue is usable with keyboard only.

## 10. Launch sequence

1. Confirm brand permission, public business name, Georgian/English copy, price VAT policy, and desired contact conversion path.
2. Add approved product/category photos and map catalogue families to applications/categories.
3. Build shared shell, home, catalogue, and product detail pages from the JSON data.
4. Add support/company/contact pages, SEO, analytics decision, and legal pages.
5. Run responsive, accessibility, content, and link QA; publish a staging build for Fixing Systems review.
