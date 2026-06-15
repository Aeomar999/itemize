/**
 * Normalizes weight strings to standard IMDB formats: "NNN g", "NNN mL", "NNN kg", "NNN L"
 */
export function normalizeWeight(raw: string | null): string | null {
  if (!raw) return null

  let str = raw.toLowerCase().replace(/\s+/g, "")
  let value = parseFloat(str)
  
  if (isNaN(value)) return raw // Fallback if we can't parse a number

  // If dual weight like "2x250g", try to parse total
  const dualMatch = str.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/)
  if (dualMatch) {
    value = parseFloat(dualMatch[1]) * parseFloat(dualMatch[2])
    // Replace the front part so we just look for unit at the end
    str = str.replace(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/, value.toString())
  }

  // Grams
  if (str.endsWith("g") && !str.endsWith("kg")) {
    return `${value} g`
  }
  
  // Kilograms
  if (str.endsWith("kg")) {
    if (value < 1) {
      return `${value * 1000} g` // Convert sub-1kg to grams
    }
    return `${value} kg`
  }
  
  // Milliliters
  if (str.endsWith("ml") || str.endsWith("milliliters") || str.endsWith("millilitres")) {
    if (value >= 1000) {
      return `${value / 1000} L` // Convert >= 1000mL to Litres
    }
    return `${value} mL`
  }

  // Liters
  if (str.endsWith("l") || str.endsWith("litre") || str.endsWith("liters") || str.endsWith("litres")) {
    return `${value} L`
  }

  // If it's a number but no recognizable unit, just return original to be safe
  return raw
}

/**
 * Normalizes packaging types to the allowed vocabulary
 */
export function normalizePackaging(raw: string | null): string | null {
  if (!raw) return null
  
  const str = raw.toLowerCase().trim()
  const validTypes = ["Bottle", "Can", "Box", "Sachet", "Pouch", "Jar", "Tube", "Carton", "Bag", "Tray", "Other"]
  const validLower = validTypes.map(t => t.toLowerCase())

  const index = validLower.indexOf(str)
  if (index !== -1) {
    return validTypes[index]
  }

  // Basic fuzzing for common variants
  if (str.includes("bottle")) return "Bottle"
  if (str.includes("can") || str.includes("tin")) return "Can"
  if (str.includes("box")) return "Box"
  if (str.includes("sachet") || str.includes("packet")) return "Sachet"
  if (str.includes("pouch")) return "Pouch"
  if (str.includes("jar") || str.includes("glass")) return "Jar"
  if (str.includes("tube")) return "Tube"
  if (str.includes("carton") || str.includes("tetrapak") || str.includes("tetra pak")) return "Carton"
  if (str.includes("bag")) return "Bag"
  if (str.includes("tray")) return "Tray"

  return "Other" // Fallback to "Other" as per schema instruction
}

/**
 * Normalizes country of origin to full English names
 */
export function normalizeCountry(raw: string | null): string | null {
  if (!raw) return null

  const str = raw.trim()
  const lower = str.toLowerCase()

  // Standard abbreviation expansions
  if (lower === "usa" || lower === "u.s.a" || lower === "u.s.a.") return "United States"
  if (lower === "uk" || lower === "u.k" || lower === "u.k.") return "United Kingdom"
  if (lower === "rsa" || lower === "za") return "South Africa"
  if (lower === "prc") return "China"
  if (lower === "uae") return "United Arab Emirates"

  // Title Case logic for normal strings
  return str.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}
