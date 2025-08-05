"use client"

import { useState, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Moon, Sun, Plus, Trash2, Check, Download, Share } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { SignatureCanvas, type SignatureCanvasRef } from "@/components/signature-canvas"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    try {
      const formData = form.getValues()
      const result = await handleSubmitServer(formData)

      if (result.success && result.pdfBytes) {
        const pdfBytes = new Uint8Array(result.pdfBytes)
        const date = new Date().toISOString().split("T")[0]
        const propertyName = formData.propertyName.replace(/[^a-zA-Z0-9]/g, "_")
        const filename = `Fire_Alarm_Report_${propertyName}_${date}.pdf`

        return { pdfBytes, filename, formData }
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("PDF generation error:", error)
      alert("An error occurred while generating the PDF.")
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

  const onSubmit = async (data: FireAlarmFormData) => {
    setIsSubmitting(true)
    try {
      const result = await handleSubmitServer(data)
      if (result.success) {
        router.push("/thank-you?message=" + encodeURIComponent(result.message))
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Submission error:", error)
      alert("An error occurred while submitting the form.")
    } finally {
      setIsSubmitting(false)
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          {/* All the existing form sections remain the same... */}
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

          {/* Section 2 - Notify Prior to Testing */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 2 — Notify Prior to Testing</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 px-4 py-2 text-left">Entity</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifyFields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{field.entity}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input {...form.register(`notifyEntities.${index}.name`)} placeholder="Enter name" />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            {...form.register(`notifyEntities.${index}.phone`)}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value)
                              form.setValue(`notifyEntities.${index}.phone`, formatted)
                            }}
                            placeholder="(###) ###-####"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* All other sections remain the same... I'll skip them for brevity but they're all still there */}
          {/* ... (all the other form sections) ... */}

          {/* Section 3 - Control Panel Status */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 3 — Control Panel Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {controlPanelQuestions.map((question, index) => {
                  const key = String.fromCharCode(97 + index) as keyof FireAlarmFormData["controlPanelStatus"]
                  return (
                    <div key={question} className="space-y-2">
                      <Label className="text-sm font-medium">{question} *</Label>
                      <RadioGroup
                        value={form.watch(`controlPanelStatus.${key}`)}
                        onValueChange={(value) => form.setValue(`controlPanelStatus.${key}`, value as any)}
                        className="flex gap-4"
                      >
                        {["Yes", "No", "N/A"].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`cp-${key}-${option}`} />
                            <Label htmlFor={`cp-${key}-${option}`} className="text-sm">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="putSystemInTestAt">Put System in Test At *</Label>
                  <Input
                    id="putSystemInTestAt"
                    type="time"
                    {...form.register("putSystemInTestAt")}
                    className={form.formState.errors.putSystemInTestAt ? "border-red-500" : ""}
                  />
                  {form.formState.errors.putSystemInTestAt && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.putSystemInTestAt.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  {...form.register("comments")}
                  placeholder="Enter any additional comments..."
                  className="min-h-[100px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4 - Equipment Tested */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 4 — Equipment Tested</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 px-4 py-2 text-left">Equipment</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Total # Tested</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Tested?</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Function OK</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentFields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            {...form.register(`equipmentTested.${index}.equipmentLabel`)}
                            className="min-w-[200px]"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            {...form.register(`equipmentTested.${index}.totalNumberTested`, { valueAsNumber: true })}
                            className="w-20"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Checkbox
                            checked={form.watch(`equipmentTested.${index}.tested`)}
                            onCheckedChange={(checked) => form.setValue(`equipmentTested.${index}.tested`, !!checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <RadioGroup
                            value={form.watch(`equipmentTested.${index}.functionOK`)}
                            onValueChange={(value) =>
                              form.setValue(`equipmentTested.${index}.functionOK`, value as any)
                            }
                            className="flex gap-2"
                          >
                            {["Yes", "No", "N/A"].map((option) => (
                              <div key={option} className="flex items-center space-x-1">
                                <RadioGroupItem value={option} id={`eq-${index}-${option}`} />
                                <Label htmlFor={`eq-${index}-${option}`} className="text-xs">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEquipment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendEquipment({ equipmentLabel: "", totalNumberTested: 0, tested: false, functionOK: "N/A" })
                }
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </CardContent>
          </Card>

          {/* Section 5 - Functional Test */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 5 — Functional Test of Output Devices</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {functionalTestQuestions.map((question, index) => {
                  const key = String.fromCharCode(97 + index) as keyof FireAlarmFormData["functionalTest"]
                  const value = form.watch(`functionalTest.${key}`)
                  return (
                    <div key={question} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Check className={`h-5 w-5 ${value === "Yes" ? "text-green-500" : "text-gray-300"}`} />
                        <Label className="text-sm font-medium">{question} *</Label>
                      </div>
                      <RadioGroup
                        value={value}
                        onValueChange={(value) => form.setValue(`functionalTest.${key}`, value as any)}
                        className="flex gap-4 ml-7"
                      >
                        {["Yes", "No", "N/A"].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`ft-${key}-${option}`} />
                            <Label htmlFor={`ft-${key}-${option}`} className="text-sm">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 6 - System Power Supplies */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 6 — System Power Supplies</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="primaryPower">Primary Power (Amps) *</Label>
                  <Input
                    id="primaryPower"
                    type="number"
                    step="0.1"
                    {...form.register("primaryPower", { valueAsNumber: true })}
                    className={form.formState.errors.primaryPower ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="nominalVoltage">Nominal Voltage (Volts) *</Label>
                  <Input
                    id="nominalVoltage"
                    type="number"
                    step="0.1"
                    {...form.register("nominalVoltage", { valueAsNumber: true })}
                    className={form.formState.errors.nominalVoltage ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="overcurrentProtection">Overcurrent Protection *</Label>
                  <Input
                    id="overcurrentProtection"
                    {...form.register("overcurrentProtection")}
                    className={form.formState.errors.overcurrentProtection ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="panelBreakerLocation">Panel Breaker Location *</Label>
                  <Input
                    id="panelBreakerLocation"
                    {...form.register("panelBreakerLocation")}
                    className={form.formState.errors.panelBreakerLocation ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="batteryTestReadingVolts">Battery Test Reading (Volts) *</Label>
                  <Input
                    id="batteryTestReadingVolts"
                    type="number"
                    step="0.1"
                    {...form.register("batteryTestReadingVolts", { valueAsNumber: true })}
                    className={form.formState.errors.batteryTestReadingVolts ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="batteryTestReadingAmps">Battery Test Reading (Amps) *</Label>
                  <Input
                    id="batteryTestReadingAmps"
                    type="number"
                    step="0.1"
                    {...form.register("batteryTestReadingAmps", { valueAsNumber: true })}
                    className={form.formState.errors.batteryTestReadingAmps ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="storageBatteryAmpHour">Storage Battery (Amp Hour) *</Label>
                  <Input
                    id="storageBatteryAmpHour"
                    type="number"
                    step="0.1"
                    {...form.register("storageBatteryAmpHour", { valueAsNumber: true })}
                    className={form.formState.errors.storageBatteryAmpHour ? "border-red-500" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="hoursSystemMustOperate">Hours System Must Operate *</Label>
                  <Input
                    id="hoursSystemMustOperate"
                    type="number"
                    step="0.1"
                    {...form.register("hoursSystemMustOperate", { valueAsNumber: true })}
                    className={form.formState.errors.hoursSystemMustOperate ? "border-red-500" : ""}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emergencyGeneratorConnected"
                    checked={form.watch("emergencyGeneratorConnected")}
                    onCheckedChange={(checked) => form.setValue("emergencyGeneratorConnected", checked)}
                  />
                  <Label htmlFor="emergencyGeneratorConnected">Emergency Generator Connected</Label>
                </div>

                <div>
                  <Label htmlFor="fuelSourceLocation">Fuel Source Location</Label>
                  <Input id="fuelSourceLocation" {...form.register("fuelSourceLocation")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 - Post Test */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 7 — Post Test</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {postTestQuestions.map((question, index) => {
                  const key = String.fromCharCode(97 + index) as keyof FireAlarmFormData["postTest"]
                  return (
                    <div key={question} className="space-y-2">
                      <Label className="text-sm font-medium">{question} *</Label>
                      <RadioGroup
                        value={form.watch(`postTest.${key}`)}
                        onValueChange={(value) => form.setValue(`postTest.${key}`, value as any)}
                        className="flex gap-4"
                      >
                        {["Yes", "No", "N/A"].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`pt-${key}-${option}`} />
                            <Label htmlFor={`pt-${key}-${option}`} className="text-sm">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6">
                <Label htmlFor="returnToServiceAt">Return to Service At *</Label>
                <Input
                  id="returnToServiceAt"
                  type="time"
                  {...form.register("returnToServiceAt")}
                  className={`max-w-xs ${form.formState.errors.returnToServiceAt ? "border-red-500" : ""}`}
                />
                {form.formState.errors.returnToServiceAt && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.returnToServiceAt.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 8 - Comments */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 8 — Incorrectly Operating Equipment / Comments</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                {...form.register("incorrectlyOperatingEquipment")}
                placeholder="Describe any incorrectly operating equipment or additional comments..."
                className="min-h-[200px] resize-y"
              />
            </CardContent>
          </Card>

          {/* Section 9 - Sign-off */}
          <Card>
            <CardHeader className="sticky top-20 bg-background z-40 border-b">
              <CardTitle style={{ color: "#144C84" }}>Section 9 — Sign-off Blocks</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Owner Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Verification - Owner</h3>

                  <div>
                    <Label htmlFor="ownerName">Name *</Label>
                    <Input
                      id="ownerName"
                      {...form.register("testVerificationOwner.name")}
                      className={form.formState.errors.testVerificationOwner?.name ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerTitle">Title *</Label>
                    <Input
                      id="ownerTitle"
                      {...form.register("testVerificationOwner.title")}
                      className={form.formState.errors.testVerificationOwner?.title ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label>Signature *</Label>
                    <SignatureCanvas
                      ref={ownerSignatureRef}
                      onSignatureChange={(signature) => form.setValue("testVerificationOwner.signature", signature)}
                      className="mt-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        ownerSignatureRef.current?.clear()
                        form.setValue("testVerificationOwner.signature", "")
                      }}
                      className="mt-2"
                    >
                      Clear Signature
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="ownerDate">Date *</Label>
                    <Input
                      id="ownerDate"
                      type="date"
                      {...form.register("testVerificationOwner.date")}
                      className={form.formState.errors.testVerificationOwner?.date ? "border-red-500" : ""}
                    />
                  </div>
                </div>

                {/* CEC Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Verification - CEC</h3>

                  <div>
                    <Label htmlFor="cecName">Name *</Label>
                    <Input
                      id="cecName"
                      {...form.register("testVerificationCEC.name")}
                      className={form.formState.errors.testVerificationCEC?.name ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cecTitle">Title *</Label>
                    <Input
                      id="cecTitle"
                      {...form.register("testVerificationCEC.title")}
                      className={form.formState.errors.testVerificationCEC?.title ? "border-red-500" : ""}
                    />
                  </div>

                  <div>
                    <Label>Signature *</Label>
                    <SignatureCanvas
                      ref={cecSignatureRef}
                      onSignatureChange={(signature) => form.setValue("testVerificationCEC.signature", signature)}
                      className="mt-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        cecSignatureRef.current?.clear()
                        form.setValue("testVerificationCEC.signature", "")
                      }}
                      className="mt-2"
                    >
                      Clear Signature
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="cecDate">Date *</Label>
                    <Input
                      id="cecDate"
                      type="date"
                      {...form.register("testVerificationCEC.date")}
                      className={form.formState.errors.testVerificationCEC?.date ? "border-red-500" : ""}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Sticky Footer with separate Save and Share buttons */}
      <footer className="sticky bottom-0 bg-background border-t shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">v1.0 © 2025 Custom Electric & Communications, LLC</p>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleSavePDF}
              disabled={isGenerating}
              variant="outline"
              className="px-6 py-3 font-semibold bg-transparent min-h-[44px] touch-manipulation"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Save PDF"}
            </Button>
            <Button
              type="button"
              onClick={handleSharePDF}
              disabled={isGenerating}
              className="px-6 py-3 font-semibold min-h-[44px] touch-manipulation"
              style={{ backgroundColor: "#144C84", color: "#fff" }}
            >
              <Share className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Share PDF"}
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-8 py-3 font-semibold min-h-[44px] touch-manipulation"
              style={{ backgroundColor: "#E8C80C", color: "#000" }}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
