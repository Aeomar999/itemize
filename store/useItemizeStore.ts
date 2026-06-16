import { create } from 'zustand'
import { IMDBRecord, IMDBFieldKey, FieldValue, MediaItem } from '@/types/imdb'

interface ItemizeState {
  records: IMDBRecord[]
  addRecord: (mediaItems: MediaItem[]) => string
  updateRecord: (id: string, updates: Partial<IMDBRecord>) => void
  updateField: (id: string, field: IMDBFieldKey, value: string) => void
  addMediaToRecord: (id: string, mediaItem: MediaItem) => void
  removeRecord: (id: string) => void
  clearSession: () => void
  recalculateNeedsReview: (id: string) => void
  recalculateDuplicates: () => void
}

const emptyField = (): FieldValue => ({ value: null, confidence: 1.0, isEdited: false, isValid: true })

const createEmptyFields = () => ({
  itemName:        emptyField(),
  barcode:         emptyField(),
  manufacturer:    emptyField(),
  brand:           emptyField(),
  weight:          emptyField(),
  packagingType:   emptyField(),
  country:         emptyField(),
  variant:         emptyField(),
  type:            emptyField(),
  fragranceFlavor: emptyField(),
  promotion:       emptyField(),
  addons:          emptyField(),
  tagline:         emptyField(),
})

export const useItemizeStore = create<ItemizeState>((set, get) => ({
  records: [],

  addRecord: (mediaItems) => {
    const id = crypto.randomUUID()
    set((state) => ({
      records: [...state.records, {
        id,
        media: mediaItems,
        status: "queued",
        fields: createEmptyFields(),
        needsReview: false,
        duplicateFlag: "none",
        duplicateOf: null,
        error: null,
      }]
    }))
    return id
  },

  addMediaToRecord: (id, mediaItem) => {
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, media: [...r.media, mediaItem], status: "queued" } : r
      )
    }))
  },

  updateRecord: (id, updates) => {
    set((state) => ({
      records: state.records.map((r) => r.id === id ? { ...r, ...updates } : r)
    }))
  },

  updateField: (id, field, value) => {
    set((state) => ({
      records: state.records.map((r) => {
        if (r.id !== id) return r
        return {
          ...r,
          fields: {
            ...r.fields,
            [field]: { ...r.fields[field], value, isEdited: true, isValid: true }
          }
        }
      })
    }))
    get().recalculateNeedsReview(id)
    get().recalculateDuplicates()
  },

  removeRecord: (id) => {
    set((state) => ({ records: state.records.filter((r) => r.id !== id) }))
    get().recalculateDuplicates()
  },

  clearSession: () => set({ records: [] }),

  recalculateNeedsReview: (id) => {
    set((state) => ({
      records: state.records.map(r => {
        if (r.id !== id) return r
        const needsReview = r.status === "error" ||
          Object.values(r.fields).some(f => f.confidence < 0.60 || f.isValid === false)
        return { ...r, needsReview }
      })
    }))
  },

  recalculateDuplicates: () => {
    set((state) => {
      const records: IMDBRecord[] = state.records.map(r => ({ ...r, duplicateFlag: "none" as const, duplicateOf: null }))
      for (let i = 0; i < records.length; i++) {
        for (let j = i + 1; j < records.length; j++) {
          const r1 = records[i], r2 = records[j]
          if (r1.status !== "done" || r2.status !== "done") continue
          const bc1 = r1.fields.barcode.value, bc2 = r2.fields.barcode.value
          if (bc1 && bc2 && bc1 === bc2) {
            records[j] = { ...records[j], duplicateFlag: "exact" as const, duplicateOf: r1.id }
            continue
          }
          const b1 = r1.fields.brand.value?.toLowerCase()
          const b2 = r2.fields.brand.value?.toLowerCase()
          const w1 = r1.fields.weight.value?.toLowerCase()
          const w2 = r2.fields.weight.value?.toLowerCase()
          if (b1 && b2 && w1 && w2 && b1 === b2 && w1 === w2) {
            records[j] = { ...records[j], duplicateFlag: "possible" as const, duplicateOf: r1.id }
          }
        }
      }
      return { records }
    })
  },
}))
