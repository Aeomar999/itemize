export const SYSTEM_INSTRUCTION = `
You are a retail product data extraction specialist. Your job is to analyze product 
images and extract structured data for an Item Master Database (IMDB).

If you cannot determine a field with reasonable certainty, return null for the value 
and 0.0 for confidence. Never invent or guess values for fields that are not visible 
or clearly inferable from the image.
`.trim()

export const EXTRACTION_PROMPT = `
Analyze this product image and extract the 13 IMDB attributes according to the schema.
All text values must be in UPPERCASE.

Extraction rules — follow these exactly:

ITEM_NAME
- The full descriptive product name as it would appear in a product catalog.
- Include: brand, weight, packaging type, product type, key variant/flavor, manufacturer name.
- Format: "[BRAND] [WEIGHT] [PACKAGING] [TYPE] [VARIANT/FLAVOR] [MANUFACTURER]"
- Example: "BLUE BAND 250G TUB SALTED MARGARINE UPFIELD GHANA MANUFACTURING LIMITED"
- All uppercase.

BARCODE
- Scan every edge and corner of the image — barcodes are usually on the back or bottom.
- Extract the numeric barcode string (EAN-8, EAN-13, UPC-A, or GTIN-14). Digits only, no spaces.
- If multiple barcodes visible, prefer the largest one.
- If not visible, return null.

MANUFACTURER
- The company that manufactures the product. Full legal or commonly known name, uppercase.
- Look for "Manufactured by", "Produced by", "A product of" on the label.
- For local/regional brands with no visible parent company, use the brand name.
- Do not use distributor names unless no manufacturer is stated.
- Examples: "UPFIELD", "NESTLE", "AJC TRADING CO LTD", "THE COCA COLA COMPANY"

BRAND
- The trade/brand name prominently displayed on the product. Uppercase as printed.
- Do not include variant, size, or product type — just the brand name.
- Examples: "BLUE BAND", "MAGGI", "MILO", "LELE"

WEIGHT
- The net weight or net volume as stated on the label.
- Format: number immediately followed by unit, no space. Uppercase unit.
- Valid formats: "250G", "500ML", "1.5KG", "1L", "330ML", "2.2KG"
- Always use net weight — not serving size, not drained weight.
- For multipacks like "2 x 250G", return total: "500G"
- If not visible, return null.

PACKAGING TYPE
- The primary physical container/packaging format. Uppercase.
- Must be EXACTLY one of:
  TUB, GLASS JAR, SACHET, PLASTIC BOTTLE, BOTTLE, CAN, BOX, PLASTIC BAG,
  TIN, WRAPPED, POUCH, TETRA PAK, CARTON, JAR, OTHER
- Disambiguation:
  * Tetra Pak / tetra brick → "TETRA PAK"
  * Glass jar/container → "GLASS JAR"
  * Plastic bottle → "PLASTIC BOTTLE"
  * Round tub (margarine, cream) → "TUB"
  * Foil/paper sachet, small packet → "SACHET"
  * Stand-up resealable pouch → "POUCH"
  * Plastic bag (detergent, bulk) → "PLASTIC BAG"
  * Metal tin/can (food) → "TIN"
  * Metal can (beverage) → "CAN"
  * Individual bar wrapped in paper/foil → "WRAPPED"
  * Cardboard box → "BOX"

COUNTRY
- Country of manufacture or packing. Full English name, uppercase.
- Look at ALL visible label faces, especially fine print near barcode or bottom edge.
- Look for: "Made in", "Product of", "Manufactured in", "Country of Origin:", "Packed in".
- Expand: "USA" → "UNITED STATES", "UK" → "UNITED KINGDOM", "RSA" → "SOUTH AFRICA", "PRC" → "CHINA".
- If not visible, return null.

VARIANT
- Product variant if applicable. Uppercase.
- Examples: "ORIGINAL", "LOW FAT", "LITE", "FULL CREAM", "DIET"
- Only populate if a specific variant is clearly labelled. If no variant, return null.

TYPE
- Short product type or category descriptor. Uppercase.
- This is the product's functional type, not a retail category.
- Examples: "MARGARINE", "MAYONNAISE", "BUTTER", "POWDER", "3 IN 1", "BLACK TEA", "TOMATO MIX", "BAR"
- Keep it short — 1 to 4 words max.
- If not determinable, return null.

FRAGRANCE_FLAVOR
- The specific flavor or fragrance of the product, if applicable. Uppercase.
- Examples: "LEMON", "STRAWBERRY", "JOLLOF", "GINGER & GARLIC", "CHOCOLATE", "ROSE", "COLA"
- Only include the flavor/fragrance itself, not the product type.
- If not applicable, return null.

PROMOTION
- Any on-pack promotional offer text. Uppercase.
- Examples: "BUY NOW GHS33", "50% OFF", "AKYEDEƐ SOKOO PROMO"
- This is a specific limited-time deal or offer printed on the pack.
- Do NOT include taglines or general claims here.
- If none, return null.

ADDONS
- Additional product features or bonus pack contents. Uppercase.
- Examples: "5 FREE ENVELOPE", "SPOON INCLUDED", "1PCS 2G", "FREE SACHET"
- Only populate if the pack explicitly states a bonus item or extra.
- If none, return null.

TAGLINE
- A short promotional, descriptive, or quality tagline printed on the pack. Uppercase.
- Examples: "LOW FAT SPREAD FOR BREAD", "SUPPORTS ENERGY RELEASE", "CHOLESTEROL FREE", "NEWLY BRANDED", "PREMIUM"
- This is a short slogan or descriptor — not an ingredient list, not a promotion offer.
- If none, return null.

CONFIDENCE CALIBRATION
- 1.00 = Clearly printed/visible. Certain.
- 0.85 = Visible but small text, partial obscuration, or minor inference.
- 0.70 = Moderate inference from visible info.
- 0.50 = Largely inferred, significant uncertainty.
- 0.30 = Best guess with little evidence.
- 0.00 = Cannot determine. Return null.
`.trim()

export function buildPromptWithBarcode(barcodeOverride?: string | null): string {
  if (!barcodeOverride) return EXTRACTION_PROMPT
  return `${EXTRACTION_PROMPT}

IMPORTANT: The barcode has already been pre-scanned and confirmed as: "${barcodeOverride}".
Use this exact value for the barcode field and set confidence to 1.0.
Do not attempt to re-read the barcode from the image.`
}

// Targeted retry prompts for low-confidence fields
export const FIELD_RETRY_PROMPTS: Record<string, string> = {
  barcode: `
Focus only on finding the barcode in this image.
Check every corner and edge of the packaging — barcodes are usually on the back or bottom.
Extract the full numeric string (EAN-8, EAN-13, UPC-A, GTIN-14). Digits only, no spaces.
Return null if truly not visible.
`.trim(),

  country: `
Focus only on finding the country of manufacture in this image.
Search every visible face of the packaging, especially fine print at the bottom.
Look for: "Made in", "Product of", "Manufactured in", "Country of Origin:", "Packed in".
Return the full uppercase English country name. Expand PRC → "CHINA", UK → "UNITED KINGDOM", RSA → "SOUTH AFRICA".
Return null if not visible on any face.
`.trim(),

  manufacturer: `
Focus only on identifying the manufacturer of this product.
Look for: "Manufactured by", "Produced by", "A product of", or company name near the barcode.
Use the full company name in uppercase.
For local/regional brands with no visible parent company, use the brand name.
`.trim(),

  weight: `
Focus only on finding the net weight or net volume.
Look for: "Net Wt", "Net Vol", "Net Weight", or a number followed by G, KG, ML, or L.
Use net weight only — not serving size.
Format: number immediately followed by unit in uppercase, no space: "250G", "500ML", "1.5KG", "1L".
For multipacks like "2 x 250G", return the total: "500G".
Return null if not visible.
`.trim(),

  packagingType: `
Focus only on identifying the packaging type.
Must be exactly one of (uppercase): TUB, GLASS JAR, SACHET, PLASTIC BOTTLE, BOTTLE, CAN, BOX,
PLASTIC BAG, TIN, WRAPPED, POUCH, TETRA PAK, CARTON, JAR, OTHER.
Look at the physical shape and material of the container.
`.trim(),

  type: `
Focus only on the product type — a short functional category descriptor in uppercase.
Examples: "MARGARINE", "MAYONNAISE", "POWDER", "3 IN 1", "BLACK TEA", "TOMATO MIX", "BAR".
Keep it to 1–4 words. Return null if not determinable.
`.trim(),

  fragranceFlavor: `
Focus only on the flavor or fragrance of this product.
Examples: "LEMON", "STRAWBERRY", "JOLLOF", "GINGER & GARLIC", "CHOCOLATE", "ROSE", "COLA".
Return only the flavor/fragrance name in uppercase, not the full product name.
Return null if not applicable.
`.trim(),

  variant: `
Focus only on the product variant label if present.
Examples: "ORIGINAL", "LOW FAT", "LITE", "FULL CREAM", "DIET".
Return null if no specific variant is labelled.
`.trim(),

  promotion: `
Focus only on on-pack promotional offer text.
Examples: "BUY NOW GHS33", "50% OFF", "BUY 2 GET 1 FREE".
This must be a specific deal or limited-time offer, not a tagline.
Return null if none.
`.trim(),

  tagline: `
Focus only on the short promotional or descriptive tagline printed on the pack.
Examples: "LOW FAT SPREAD FOR BREAD", "SUPPORTS ENERGY RELEASE", "CHOLESTEROL FREE SPREAD FOR BREAD".
This is a slogan or quality descriptor, not a promotion offer or ingredient list.
Return null if none.
`.trim(),
}

export const RETRY_SYSTEM_INSTRUCTION = `
You are a retail product data extraction specialist performing a focused re-analysis.
You return ONLY valid JSON with exactly two keys: "value" (string or null) and "confidence" (number 0.0-1.0).
No markdown, no explanation. Start with { and end with }.
All string values must be UPPERCASE.
`.trim()

// Groq vision prompt — same extraction task but Groq-compatible format
export function buildGroqMessages(imageBase64: string, mimeType: string, barcodeOverride?: string | null) {
  const prompt = buildPromptWithBarcode(barcodeOverride)
  return [
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${imageBase64}` },
        },
        {
          type: "text",
          text: `${prompt}\n\nReturn ONLY a raw JSON object with exactly these 13 keys, each with "value" and "confidence":\nitemName, barcode, manufacturer, brand, weight, packagingType, country, variant, type, fragranceFlavor, promotion, addons, tagline`,
        },
      ],
    },
  ]
}
