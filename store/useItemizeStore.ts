import { create } from 'zustand'
import { IMDBRecord, IMDBFieldKey, FieldValue } from '@/types/imdb'

interface ItemizeState {
  records: IMDBRecord[]
  addRecord: (imageUrl: string, imageName: string) => string
  updateRecord: (id: string, updates: Partial<IMDBRecord>) => void
  updateField: (id: string, field: IMDBFieldKey, value: string) => void
  removeRecord: (id: string) => void
  clearSession: () => void
  recalculateNeedsReview: (id: string) => void
  recalculateDuplicates: () => void
}

const createEmptyFields = () => {
  const emptyField: FieldValue = { value: null, confidence: 1.0, isEdited: false, isValid: true }
  return {
    barcode: { ...emptyField },
    categoryType: { ...emptyField },
    segmentType: { ...emptyField },
    manufacturer: { ...emptyField },
    brand: { ...emptyField },
    productName: { ...emptyField },
    weightAndUnit: { ...emptyField },
    packagingType: { ...emptyField },
    countryOfOrigin: { ...emptyField },
    promotionalMessages: { ...emptyField }
  }
}

export const useItemizeStore = create<ItemizeState>((set, get) => ({
  records: [],

  addRecord: (imageUrl, imageName) => {
    const id = crypto.randomUUID()
    const newRecord: IMDBRecord = {
      id,
      imageUrl,
      imageName,
      status: "queued",
      fields: createEmptyFields(),
      needsReview: false,
      duplicateFlag: "none",
      duplicateOf: null,
      error: null
    }

    set((state) => ({
      records: [...state.records, newRecord]
    }))

    return id
  },

  updateRecord: (id, updates) => {
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }))
  },

  updateField: (id, field, value) => {
    set((state) => {
      const records = state.records.map((r) => {
        if (r.id !== id) return r
        
        const newFields = {
          ...r.fields,
          [field]: {
            ...r.fields[field],
            value,
            isEdited: true,
            isValid: true // Assume user edits resolve validity issues
          }
        }

        return { ...r, fields: newFields }
      })
      return { records }
    })
    
    get().recalculateNeedsReview(id)
    get().recalculateDuplicates()
  },

  removeRecord: (id) => {
    set((state) => ({
      records: state.records.filter((r) => r.id !== id)
    }))
    get().recalculateDuplicates()
  },

  clearSession: () => {
    set({ records: [] })
  },

  recalculateNeedsReview: (id) => {
    set((state) => ({
      records: state.records.map(r => {
        if (r.id !== id) return r
        
        let needsReview = false
        if (r.status === "error") needsReview = true
        
        // Check confidence < 0.60 or isValid === false
        Object.values(r.fields).forEach(f => {
          if (f.confidence < 0.60 || f.isValid === false) {
            needsReview = true
          }
        })
        
        return { ...r, needsReview }
      })
    }))
  },

  recalculateDuplicates: () => {
    // Simple naive duplicate detection
    // EXACT: matching barcode
    // POSSIBLE: matching brand + weightAndUnit
    set((state) => {
      const records = [...state.records]
      
      // Reset flags
      records.forEach(r => {
        r.duplicateFlag = "none"
        r.duplicateOf = null
      })

      for (let i = 0; i < records.length; i++) {
        for (let j = i + 1; j < records.length; j++) {
          const r1 = records[i]
          const r2 = records[j]
          
          if (r1.status !== "done" || r2.status !== "done") continue

          const bc1 = r1.fields.barcode.value
          const bc2 = r2.fields.barcode.value

          if (bc1 && bc2 && bc1 === bc2) {
            r2.duplicateFlag = "exact"
            r2.duplicateOf = r1.id
            continue
          }

          const b1 = r1.fields.brand.value?.toLowerCase()
          const b2 = r2.fields.brand.value?.toLowerCase()
          const w1 = r1.fields.weightAndUnit.value?.toLowerCase()
          const w2 = r2.fields.weightAndUnit.value?.toLowerCase()

          if (b1 && b2 && w1 && w2 && b1 === b2 && w1 === w2) {
            r2.duplicateFlag = "possible"
            r2.duplicateOf = r1.id
          }
        }
      }

      return { records }
    })
  }
}))
