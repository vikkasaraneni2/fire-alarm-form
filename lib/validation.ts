import { z } from "zod"

export const fireAlarmSchema = z.object({
  // Section 1 - Property Info
  propertyName: z.string().min(1, "Property name is required"),
  street: z.string().min(1, "Street is required"),
  cityStateZip: z.string().min(1, "City, State, Zip is required"),
  contact: z.string().min(1, "Contact is required"),
  phone: z.string().min(1, "Phone is required"),
  frequencyOfInspection: z.enum(["Quarterly", "Semi-Annual", "Annual", "Other"]),
  date: z.string().min(1, "Date is required"),

  // Section 2 - Notify Prior to Testing
  notifyEntities: z.array(
    z.object({
      entity: z.string(),
      name: z.string(),
      phone: z.string().optional(),
    }),
  ),

  // Section 3 - Control Panel Status
  controlPanelStatus: z.object({
    a: z.enum(["Yes", "No", "N/A"]),
    b: z.enum(["Yes", "No", "N/A"]),
    c: z.enum(["Yes", "No", "N/A"]),
    d: z.enum(["Yes", "No", "N/A"]),
    e: z.enum(["Yes", "No", "N/A"]),
    f: z.enum(["Yes", "No", "N/A"]),
    g: z.enum(["Yes", "No", "N/A"]),
    h: z.enum(["Yes", "No", "N/A"]),
    i: z.enum(["Yes", "No", "N/A"]),
    j: z.enum(["Yes", "No", "N/A"]),
  }),
  putSystemInTestAt: z.string().min(1, "Test time is required"),
  comments: z.string().optional(),

  // Section 4 - Equipment Tested
  equipmentTested: z.array(
    z.object({
      equipmentLabel: z.string(),
      totalNumberTested: z.number().min(0),
      tested: z.boolean(),
      functionOK: z.enum(["Yes", "No", "N/A"]),
    }),
  ),

  // Section 5 - Functional Test
  functionalTest: z.object({
    a: z.enum(["Yes", "No", "N/A"]),
    b: z.enum(["Yes", "No", "N/A"]),
    c: z.enum(["Yes", "No", "N/A"]),
    d: z.enum(["Yes", "No", "N/A"]),
    e: z.enum(["Yes", "No", "N/A"]),
    f: z.enum(["Yes", "No", "N/A"]),
  }),

  // Section 6 - System Power Supplies
  primaryPower: z.number().min(0),
  nominalVoltage: z.number().min(0),
  overcurrentProtection: z.string().min(1, "Overcurrent protection is required"),
  panelBreakerLocation: z.string().min(1, "Panel breaker location is required"),
  batteryTestReadingVolts: z.number().min(0),
  batteryTestReadingAmps: z.number().min(0),
  storageBatteryAmpHour: z.number().min(0),
  hoursSystemMustOperate: z.number().min(0),
  emergencyGeneratorConnected: z.boolean(),
  fuelSourceLocation: z.string().optional(),

  // Section 7 - Post Test
  postTest: z.object({
    a: z.enum(["Yes", "No", "N/A"]),
    b: z.enum(["Yes", "No", "N/A"]),
    c: z.enum(["Yes", "No", "N/A"]),
    d: z.enum(["Yes", "No", "N/A"]),
    e: z.enum(["Yes", "No", "N/A"]),
  }),
  returnToServiceAt: z.string().min(1, "Return to service time is required"),

  // Section 8 - Comments
  incorrectlyOperatingEquipment: z.string().optional(),

  // Section 9 - Sign-off (make signatures optional for testing)
  testVerificationOwner: z.object({
    name: z.string().min(1, "Owner name is required"),
    title: z.string().min(1, "Owner title is required"),
    signature: z.string().optional(),
    date: z.string().min(1, "Owner date is required"),
  }),
  testVerificationCEC: z.object({
    name: z.string().min(1, "CEC name is required"),
    title: z.string().min(1, "CEC title is required"),
    signature: z.string().optional(),
    date: z.string().min(1, "CEC date is required"),
  }),
})

export type FireAlarmFormData = z.infer<typeof fireAlarmSchema>
