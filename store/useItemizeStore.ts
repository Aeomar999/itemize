import { create } from 'zustand'
import { IMDBRecord, IMDBFieldKey, FieldValue, MediaItem } from '@/types/imdb'
import { supabase } from '@/lib/supabase'

interface ItemizeState {
  records: IMDBRecord[]
  isHydrated: boolean
  fetchRecords: () => Promise<void>
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
  isHydrated: false,

  fetchRecords: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (!error && data) {
      set({ records: data as IMDBRecord[], isHydrated: true })
      get().recalculateDuplicates()
    } else {
      set({ isHydrated: true })
      console.error("Failed to fetch records:", error)
    }
  },

  addRecord: (mediaItems) => {
    const id = crypto.randomUUID()
    const newRecord: IMDBRecord = {
      id,
      media: mediaItems,
      status: "queued",
      fields: createEmptyFields(),
      needsReview: false,
      duplicateFlag: "none",
      duplicateOf: null,
      error: null,
    }
    
    // Update local state instantly
    set((state) => ({ records: [newRecord, ...state.records] }))
    
    // Sync to Supabase
    supabase.from('products').insert([newRecord]).then(({ error }) => {
      if (error) console.error("Error inserting record:", error)
    })
    
    return id
  },

  addMediaToRecord: (id, mediaItem) => {
    set((state) => {
      const records = state.records.map((r) =>
        r.id === id ? { ...r, media: [...r.media, mediaItem], status: "queued" as const } : r
      )
      
      const updatedRecord = records.find(r => r.id === id)
      if (updatedRecord) {
        supabase.from('products').update({ media: updatedRecord.media, status: "queued" }).eq('id', id).then()
      }
      
      return { records }
    })
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const records = state.records.map((r) => r.id === id ? { ...r, ...updates } : r)
      supabase.from('products').update(updates).eq('id', id).then()
      return { records }
    })
  },

  updateField: (id, field, value) => {
    set((state) => {
      const records = state.records.map((r) => {
        if (r.id !== id) return r
        return {
          ...r,
          fields: {
            ...r.fields,
            [field]: { ...r.fields[field], value, isEdited: true, isValid: true, confidence: 1.0 }
          }
        }
      })
      
      const updatedRecord = records.find(r => r.id === id)
      if (updatedRecord) {
        supabase.from('products').update({ fields: updatedRecord.fields }).eq('id', id).then()
      }
      
      return { records }
    })
    get().recalculateNeedsReview(id)
    get().recalculateDuplicates()
  },

  removeRecord: (id) => {
    set((state) => ({ records: state.records.filter((r) => r.id !== id) }))
    supabase.from('products').delete().eq('id', id).then()
    get().recalculateDuplicates()
  },

  clearSession: () => {
    set({ records: [] })
    // We do NOT clear Supabase on clearSession to preserve data!
  },

  recalculateNeedsReview: (id) => {
    set((state) => {
      const records = state.records.map(r => {
        if (r.id !== id) return r
        const needsReview = r.status === "error" ||
          Object.values(r.fields).some(f => f.confidence < 0.60 || f.isValid === false)
        return { ...r, needsReview }
      })
      
      const updatedRecord = records.find(r => r.id === id)
      if (updatedRecord) {
        supabase.from('products').update({ needsReview: updatedRecord.needsReview }).eq('id', id).then()
      }
      
      return { records }
    })
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
          if (records[j].duplicateFlag !== "exact") {
            const b1 = r1.fields.brand.value?.toLowerCase()
            const b2 = r2.fields.brand.value?.toLowerCase()
            const w1 = r1.fields.weight.value?.toLowerCase()
            const w2 = r2.fields.weight.value?.toLowerCase()
            if (b1 && b2 && w1 && w2 && b1 === b2 && w1 === w2) {
              records[j] = { ...records[j], duplicateFlag: "possible" as const, duplicateOf: r1.id }
            }
          }
        }
      }
      
      // Batch update duplicates
      records.forEach(r => {
        const original = state.records.find(orig => orig.id === r.id)
        if (original && (original.duplicateFlag !== r.duplicateFlag || original.duplicateOf !== r.duplicateOf)) {
          supabase.from('products').update({ duplicateFlag: r.duplicateFlag, duplicateOf: r.duplicateOf }).eq('id', r.id).then()
        }
      })
      
      return { records }
    })
  },
}))
