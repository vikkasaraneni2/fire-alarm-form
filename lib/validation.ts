import { z } from "zod"

export const fireAlarmSchema = z.object({
  // Section 1 - Property Info
  propertyName: z.string().optional(),
  street: z.string().optional(),
  cityStateZip: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  frequencyOfInspection: z.enum(["", "Quarterly", "Semi-Annual", "Annual", "Other"]).optional(),
  date: z.string().optional(),

  // Section 2 - Notify Prior to Testing
  notifyEntities: z.array(
    z.object({
      entity: z.string().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
    }),
  ).optional(),

  // Section 3 - Control Panel Status
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  controlPanelStatus: z.object({
    a: z.enum(["", "Yes", "No", "N/A"]).optional(),
    b: z.enum(["", "Yes", "No", "N/A"]).optional(),
    c: z.enum(["", "Yes", "No", "N/A"]).optional(),
    d: z.enum(["", "Yes", "No", "N/A"]).optional(),
    e: z.enum(["", "Yes", "No", "N/A"]).optional(),
    f: z.enum(["", "Yes", "No", "N/A"]).optional(),
    g: z.enum(["", "Yes", "No", "N/A"]).optional(),
    h: z.enum(["", "Yes", "No", "N/A"]).optional(),
    i: z.enum(["", "Yes", "No", "N/A"]).optional(),
    j: z.enum(["", "Yes", "No", "N/A"]).optional(),
    k: z.enum(["", "Yes", "No", "N/A"]).optional(),
  }).optional(),
  putSystemInTestAt: z.string().optional(),
  comments: z.string().optional(),

  // Section 4 - Equipment Tested
  systemType: z.enum(["", "Conventional", "Addressable"]).optional(),
  equipmentTested: z.array(
    z.object({
      equipmentLabel: z.string().optional(),
      totalNumber: z.number().optional(),
      totalNumberTested: z.number().optional(),
              functionOK: z.enum(["", "Yes", "No", "N/A"]).optional(),
    }),
  ).optional(),

  // Section 5 - Functional Test of Output Devices
  functionalTest: z.object({
    a: z.enum(["", "Yes", "No", "N/A"]).optional(),
    b: z.enum(["", "Yes", "No", "N/A"]).optional(),
    c: z.enum(["", "Yes", "No", "N/A"]).optional(),
    d: z.enum(["", "Yes", "No", "N/A"]).optional(),
    e: z.enum(["", "Yes", "No", "N/A"]).optional(),
    f: z.enum(["", "Yes", "No", "N/A"]).optional(),
  }).optional(),

  // Section 6 - System Power Supplies
  primaryPower: z.string().optional(),
  nominalVoltage: z.string().optional(),
  nominalVoltageAmps: z.string().optional(),
  overcurrentProtection: z.string().optional(),
  overcurrentProtectionAmps: z.string().optional(),
  panelBreakerLocation: z.string().optional(),
  batteryTestReading: z.string().optional(),
  storageBattery: z.string().optional(),
  hoursSystemMustOperate: z.string().optional(),
  emergencyGeneratorConnected: z.boolean().optional(),
  fuelSourceLocation: z.string().optional(),

  // Section 7 - Post Test
  postTest: z.object({
    a: z.enum(["", "Yes", "No", "N/A"]).optional(),
    b: z.enum(["", "Yes", "No", "N/A"]).optional(),
    c: z.enum(["", "Yes", "No", "N/A"]).optional(),
    d: z.enum(["", "Yes", "No", "N/A"]).optional(),
    e: z.enum(["", "Yes", "No", "N/A"]).optional(),
  }).optional(),
  returnToServiceAt: z.string().optional(),
  incorrectlyOperatingEquipment: z.string().optional(),

  // Section 8 - Sign-off Blocks
  testVerificationOwner: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    signature: z.string().optional(), // Base64 image data
    date: z.string().optional(),
  }).optional(),
  testVerificationCEC: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    signature: z.string().optional(), // Base64 image data
    date: z.string().optional(),
  }).optional(),
})

export type FireAlarmFormData = z.infer<typeof fireAlarmSchema>
