export interface NotifyEntity {
  entity: string
  name: string
  phone?: string
}

export interface EquipmentItem {
  equipmentLabel: string
  totalNumberTested: number
  tested: boolean
  functionOK: "Yes" | "No" | "N/A"
}

export interface SignatureData {
  name: string
  title: string
  signature: string
  date: string
}

export type YesNoNA = "Yes" | "No" | "N/A"
