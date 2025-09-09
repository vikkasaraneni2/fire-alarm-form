export interface NotifyEntity {
  entity: string
  name: string
  phone?: string
}

export interface EquipmentItem {
  equipmentLabel: string
  totalNumber: number
  totalNumberTested: number
  functionYesCount: number
  functionNoCount: number
  functionNaCount: number
  failedDetails?: FailedDetail[]
}

export interface PhotoItem {
  id: string
  mimeType: "image/jpeg" | "image/png"
  width?: number
  height?: number
  dataUrl: string
  caption?: string
}

export interface FailedDetail {
  location: string
  brand?: string
  model?: string
  note?: string
  photos?: PhotoItem[]
}

export interface SignatureData {
  name: string
  title: string
  signature: string
  date: string
}

export type YesNoNA = "Yes" | "No" | "N/A"
