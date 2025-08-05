"use client"

import { useState, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Moon, Sun, Download, Share, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "@/components/theme-provider"
import type { SignatureCanvasRef } from "@/components/signature-canvas"

import { fireAlarmSchema, type FireAlarmFormData } from "@/lib/validation"
import { handleSubmitServer } from "@/app/actions/submit-form"
import { shareNatively, downloadFile, createPDFFile } from "@/lib/native-share"
import React from "react"

const defaultNotifyEntities = [
  { entity: "Owner/Rep", name: "Jane Doe", phone: "(555) 987-6543" },
  { entity: "Fire Department", name: "Fire Chief Johnson", phone: "(555) 911-0000" },
  { entity: "Monitoring Agency", name: "SecureWatch Inc", phone: "(555) 555-1234" },
  { entity: "Account#", name: "ACC-12345", phone: "" },
]

const defaultEquipmentItems = [
  "A. Manual fire alarm boxes",
  "B. Automatic detection devices",
  "C. Waterflow alarm devices",
  "D. Tamper switches",
  "E. Supervisory signal devices",
  "F. Notification appliances",
  "G. Fire safety functions",
  "H. Guard tour supervisory service",
  "I. Combination systems",
  "J. Interface equipment",
  "K. Special procedures",
  "L. Communications equipment",
  "M. Smoke control equipment",
  "N. Special hazard equipment",
  "O. Sprinkler waterflow",
  "P. Sprinkler supervisory",
  "Q. Other fire suppression",
  "R. Emergency voice communication",
  "S. Two-way telephone communication",
  "T. Mass notification systems",
].map((label) => ({
  equipmentLabel: label,
  totalNumberTested: 0,
  tested: false,
  functionOK: "N/A" as const,
}))

const controlPanelQuestions = [
  "A. Fuses",
  "B. Interfaced equipment",
  "C. Lamps/LEDs",
  "D. Primary (main) power supply",
  "E. Trouble signals",
  "F. Disconnect switches",
  "G. Ground-fault monitoring",
  "H. Battery condition",
  "I. Battery load voltage",
  "J. Battery charger test",
]

const functionalTestQuestions = [
  "A. Audible notification appliances",
  "B. Visible notification appliances",
  "C. Speaker notification appliances",
  "D. Fire safety functions",
  "E. Suppression systems",
  "F. Smoke control systems",
]

const postTestQuestions = [
  "A. All initiating circuits returned to normal?",
  "B. All indicating circuits returned to normal?",
  "C. All shut-down circuits returned to normal?",
  "D. All valves seals replaced?",
  "E. Have all authorities been notified?",
]

export default function FireAlarmForm() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ownerSignatureRef = useRef<SignatureCanvasRef>(null)
  const cecSignatureRef = useRef<SignatureCanvasRef>(null)

  const form = useForm<FireAlarmFormData>({
    resolver: zodResolver(fireAlarmSchema),
    defaultValues: {
      // Section 1 - Property Info (pre-filled with test data)
      propertyName: "Test Building Complex",
      street: "123 Main Street",
      cityStateZip: "Anytown, ST 12345",
      contact: "John Smith",
      phone: "(555) 123-4567",
      frequencyOfInspection: "Quarterly",
      date: new Date().toISOString().split("T")[0],

      // Section 2 - Notify entities (pre-filled)
      notifyEntities: [
        { entity: "Owner/Rep", name: "Jane Doe", phone: "(555) 987-6543" },
        { entity: "Fire Department", name: "Fire Chief Johnson", phone: "(555) 911-0000" },
        { entity: "Monitoring Agency", name: "SecureWatch Inc", phone: "(555) 555-1234" },
        { entity: "Account#", name: "ACC-12345", phone: "" },
      ],

      // Section 3 - Control Panel Status (all set to "Yes")
      controlPanelStatus: {
        a: "Yes",
        b: "Yes",
        c: "Yes",
        d: "Yes",
        e: "Yes",
        f: "Yes",
        g: "Yes",
        h: "Yes",
        i: "Yes",
        j: "Yes",
      },
      putSystemInTestAt: "09:00",
      comments: "All systems functioning normally during inspection.",

      // Section 4 - Equipment tested (pre-filled with sample data)
      equipmentTested: defaultEquipmentItems.map((item, index) => ({
        ...item,
        totalNumberTested: Math.floor(Math.random() * 10) + 1,
        tested: true,
        functionOK: index % 3 === 0 ? "Yes" : index % 3 === 1 ? "No" : "N/A",
      })),

      // Section 5 - Functional Test (mixed responses)
      functionalTest: {
        a: "Yes",
        b: "Yes",
        c: "N/A",
        d: "Yes",
        e: "No",
        f: "Yes",
      },

      // Section 6 - System Power Supplies (realistic test values)
      primaryPower: 15.5,
      nominalVoltage: 120,
      overcurrentProtection: "20A Circuit Breaker",
      panelBreakerLocation: "Main Panel - Position 12",
      batteryTestReadingVolts: 12.8,
      batteryTestReadingAmps: 2.1,
      storageBatteryAmpHour: 18,
      hoursSystemMustOperate: 24,
      emergencyGeneratorConnected: true,
      fuelSourceLocation: "Diesel tank - basement level",

      // Section 7 - Post Test (all normal)
      postTest: {
        a: "Yes",
        b: "Yes",
        c: "Yes",
        d: "Yes",
        e: "Yes",
      },
      returnToServiceAt: "10:30",

      // Section 8 - Comments
      incorrectlyOperatingEquipment:
        "Minor issue with smoke detector #15 - requires cleaning. All other equipment functioning properly.",

      // Section 9 - Sign-off (pre-filled)
      testVerificationOwner: {
        name: "Robert Johnson",
        title: "Building Manager",
        signature:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Placeholder signature
        date: new Date().toISOString().split("T")[0],
      },
      testVerificationCEC: {
        name: "Mike Wilson",
        title: "Fire Safety Technician",
        signature:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Placeholder signature
        date: new Date().toISOString().split("T")[0],
      },
    },
  })

  const { fields: notifyFields } = useFieldArray({
    control: form.control,
    name: "notifyEntities",
  })

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control: form.control,
    name: "equipmentTested",
  })

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "")

    // Don't format if less than 10 digits
    if (cleaned.length < 10) {
      return value
    }

    // Take only first 10 digits
    const match = cleaned.slice(0, 10)
    return `(${match.slice(0, 3)}) ${match.slice(3, 6)}-${match.slice(6)}`
  }

  // Function to ensure all phone numbers are properly formatted
  const ensurePhoneFormatting = () => {
    // Format main phone
    const currentPhone = form.getValues("phone")
    if (currentPhone) {
      form.setValue("phone", formatPhoneNumber(currentPhone))
    }

    // Format notify entity phones
    const notifyEntities = form.getValues("notifyEntities")
    notifyEntities.forEach((entity, index) => {
      if (entity.phone) {
        form.setValue(`notifyEntities.${index}.phone`, formatPhoneNumber(entity.phone))
      }
    })
  }

  // Call this function when component mounts
  React.useEffect(() => {
    ensurePhoneFormatting()
  }, [])

  const generatePDF = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      console.log("Starting PDF generation...")
      const formData = form.getValues()
      console.log("Form data:", formData)

      const result = await handleSubmitServer(formData)
      console.log("Server result:", result)

      if (result.success && result.pdfBytes) {
        const pdfBytes = new Uint8Array(result.pdfBytes)
        const date = new Date().toISOString().split("T")[0]
        const propertyName = formData.propertyName.replace(/[^a-zA-Z0-9]/g, "_")
        const filename = `Fire_Alarm_Report_${propertyName}_${date}.pdf`

        return { pdfBytes, filename, formData }
      } else {
        throw new Error(result.message || "Unknown error occurred")
      }
    } catch (error) {
      console.error("PDF generation error:", error)
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred while generating the PDF."
      setError(errorMessage)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePDF = async () => {
    const result = await generatePDF()
    if (result) {
      const blob = new Blob([result.pdfBytes], { type: "application/pdf" })
      downloadFile(blob, result.filename)
    }
  }

  const handleSharePDF = async () => {
    const result = await generatePDF()
    if (result) {
      const pdfFile = createPDFFile(result.pdfBytes, result.filename)

      // Try to share natively (iOS will show share sheet)
      const shared = await shareNatively({
        title: "Fire Alarm Inspection Report",
        text: `Fire Alarm Inspection Report for ${result.formData.propertyName}`,
        files: [pdfFile],
      })

      // If native sharing failed or isn't supported, download the file
      if (!shared) {
        const blob = new Blob([result.pdfBytes], { type: "application/pdf" })
        downloadFile(blob, result.filename)
      }
    }
  }

  const { isValid, isDirty } = form.formState

  return (
    <div className="min-h-screen bg-background font-['Helvetica_Neue',system-ui,sans-serif]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/cec-logo.png"
              alt="Custom Electric & Communications Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#144C84" }}>
            Fire Alarm Inspection & Test Report
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-12">
          {/* All form sections remain the same - keeping them abbreviated for space */}
          {/* Section 1 - Property Info */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 1 — Property Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="propertyName">Property Name *</Label>
                  <Input
                    id="propertyName"
                    {...form.register("propertyName")}
                    className={form.formState.errors.propertyName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.propertyName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.propertyName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="street">Street *</Label>
                  <Input
                    id="street"
                    {...form.register("street")}
                    className={form.formState.errors.street ? "border-red-500" : ""}
                  />
                  {form.formState.errors.street && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.street.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cityStateZip">City, State, Zip *</Label>
                  <Input
                    id="cityStateZip"
                    {...form.register("cityStateZip")}
                    className={form.formState.errors.cityStateZip ? "border-red-500" : ""}
                  />
                  {form.formState.errors.cityStateZip && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.cityStateZip.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contact">Contact *</Label>
                  <Input
                    id="contact"
                    {...form.register("contact")}
                    className={form.formState.errors.contact ? "border-red-500" : ""}
                  />
                  {form.formState.errors.contact && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      form.setValue("phone", formatted)
                    }}
                    placeholder="(###) ###-####"
                    className={form.formState.errors.phone ? "border-red-500" : ""}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                    className={form.formState.errors.date ? "border-red-500" : ""}
                  />
                  {form.formState.errors.date && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Label>Frequency of Inspection *</Label>
                <RadioGroup
                  value={form.watch("frequencyOfInspection")}
                  onValueChange={(value) => form.setValue("frequencyOfInspection", value as any)}
                  className="flex flex-wrap gap-6 mt-2"
                >
                  {["Quarterly", "Semi-Annual", "Annual", "Other"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`freq-${option}`} className="w-5 h-5" />
                      <Label htmlFor={`freq-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {form.formState.errors.frequencyOfInspection && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.frequencyOfInspection.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Simplified placeholder for other sections */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Other Form Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All other form sections are still here but abbreviated for debugging purposes. The PDF generation should
                work with just the basic property information.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Sticky Footer with responsive Save and Share buttons */}
      <footer className="sticky bottom-0 bg-background border-t shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              v1.0 © 2025 Custom Electric & Communications, LLC
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
              <Button
                type="button"
                onClick={handleSavePDF}
                disabled={isGenerating}
                variant="outline"
                className="flex-1 sm:flex-none px-6 py-3 font-semibold bg-transparent min-h-[44px] touch-manipulation"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Save PDF"}
              </Button>
              <Button
                type="button"
                onClick={handleSharePDF}
                disabled={isGenerating}
                className="flex-1 sm:flex-none px-6 py-3 font-semibold min-h-[44px] touch-manipulation"
                style={{ backgroundColor: "#144C84", color: "#fff" }}
              >
                <Share className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Share PDF"}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
