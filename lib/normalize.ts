/**
 * Normalizes weight strings to competition format: "250G", "500ML", "1.5KG", "1L"
 * Number immediately followed by uppercase unit, no space.
 */
export function normalizeWeight(raw: string | null): string | null {
  if (!raw) return null

  let str = raw.toLowerCase().replace(/\s+/g, "")

  // Normalize spelled-out units to abbreviated forms
  str = str.replace(/\bmilliliters?\b/g, "ml")
  str = str.replace(/\bmillilitres?\b/g, "ml")
  str = str.replace(/\bliters?\b/g, "l")
  str = str.replace(/\blitres?\b/g, "l")
  str = str.replace(/\bkilograms?\b/g, "kg")
  str = str.replace(/\bgrams?\b/g, "g")

  // Handle multipack: "2x250g" → "500g"
  const dualMatch = str.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/)
  if (dualMatch) {
    const total = parseFloat(dualMatch[1]) * parseFloat(dualMatch[2])
    str = str.replace(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/, total.toString())
  }

  const value = parseFloat(str)
  if (isNaN(value)) return raw.toUpperCase()

  if ((str.endsWith("ml") || str.endsWith("milliliters") || str.endsWith("millilitres"))) {
    // Keep as ML (do not convert to L — competition format uses "909ML" not "0.9L")
    return `${value}ML`
  }

  if (str.endsWith("l") && !str.endsWith("ml")) {
    return `${value}L`
  }

  if (str.endsWith("kg")) {
    // Keep as KG (competition uses "2.2KG" not "2200G")
    return `${value}KG`
  }

  if (str.endsWith("g") && !str.endsWith("kg")) {
    return `${value}G`
  }

  return raw.toUpperCase()
}

/**
 * Normalizes packaging type to competition vocabulary (uppercase)
 */
export function normalizePackaging(raw: string | null): string | null {
  if (!raw) return null

  const str = raw.toUpperCase().trim()

  const exact = [
    "TUB", "GLASS JAR", "SACHET", "PLASTIC BOTTLE", "BOTTLE", "CAN",
    "BOX", "PLASTIC BAG", "TIN", "WRAPPED", "POUCH", "TETRA PAK",
    "CARTON", "JAR", "OTHER"
  ]
  if (exact.includes(str)) return str

  // Fuzzy matching - check more specific patterns first
  if (str.includes("TETRA") || str.includes("TETRAPAK")) return "TETRA PAK"
  if (str.includes("PLASTIC BOTTLE") || (str.includes("PLASTIC") && str.includes("BOTTLE"))) return "PLASTIC BOTTLE"
  if (str.includes("PLASTIC BAG") || (str.includes("PLASTIC") && str.includes("BAG"))) return "PLASTIC BAG"
  if (str.includes("GLASS") && str.includes("BOTTLE")) return "BOTTLE"
  if (str.includes("GLASS")) return "GLASS JAR"
  if (str.includes("TUB")) return "TUB"
  if (str.includes("SACHET") || str.includes("PACKET")) return "SACHET"
  if (str.includes("POUCH")) return "POUCH"
  if (str.includes("BOTTLE")) return "BOTTLE"
  if (str.includes("CAN") || str.includes("BEVERAGE CAN")) return "CAN"
  if (str.includes("TIN")) return "TIN"
  if (str.includes("CARTON")) return "CARTON"
  if (str.includes("BOX") || str.includes("CARDBOARD")) return "BOX"
  if (str.includes("WRAP")) return "WRAPPED"
  if (str.includes("JAR")) return "JAR"
  if (str.includes("BAG")) return "PLASTIC BAG"

  return "OTHER"
}

/**
 * Normalizes country to full uppercase English name
 */
export function normalizeCountry(raw: string | null): string | null {
  if (!raw) return null

  const str = raw.trim().toUpperCase()

  const map: Record<string, string> = {
    "USA": "UNITED STATES",
    "U.S.A": "UNITED STATES",
    "U.S.A.": "UNITED STATES",
    "US": "UNITED STATES",
    "UK": "UNITED KINGDOM",
    "U.K": "UNITED KINGDOM",
    "U.K.": "UNITED KINGDOM",
    "GREAT BRITAIN": "UNITED KINGDOM",
    "GB": "UNITED KINGDOM",
    "RSA": "SOUTH AFRICA",
    "ZA": "SOUTH AFRICA",
    "PRC": "CHINA",
    "P.R.C": "CHINA",
    "P.R.C.": "CHINA",
    "UAE": "UNITED ARAB EMIRATES",
    "U.A.E": "UNITED ARAB EMIRATES",
    "CI": "COTE D'IVOIRE",
    "IVORY COAST": "COTE D'IVOIRE",
    "CÔTE D'IVOIRE": "COTE D'IVOIRE",
  }

  return map[str] ?? str
}
