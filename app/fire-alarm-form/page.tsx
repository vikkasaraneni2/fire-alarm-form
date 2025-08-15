"use client"

import { useState, useRef, useEffect } from "react"
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
import { SignatureCanvas } from "@/components/signature-canvas"

import { fireAlarmSchema, type FireAlarmFormData } from "@/lib/validation"
import { handleSubmitServer } from "@/app/actions/submit-form"
import { shareNatively, downloadFile, createPDFFile } from "@/lib/native-share"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  "A. Is panel monitored by outside agency?",
  "B. Is the power light on?",
  "C. Does the panel indicate normal conditions?",
  "D. Are all indicating lamp bulbs in operating order?",
  "E. Does the TROUBLE light operate?",
  "F. Does the SILENCE light operate?",
  "G. Does the panel have active zones?",
  "H. Does the panel have non-functioning zones?",
  "I. Does the panel have battery backup?",
  "J. Do the batteries indicate proper charge?",
  "K. Have Fire Dept. and Monitoring Agency been notified? Have equipment shutdowns been disabled?",
]

const functionalTestQuestions = [
  "A. Did all indicating circuits function normally?",
  "B. If tested, did air handlers shut down?", 
  "C. If tested, did elevators recall?",
  "D. If tested, did suppression system solenoid energize?",
  "E. If tested, did panel send alarm signal to monitoring agency?",
  "F. If tested, did panel send trouble signal to monitoring agency?",
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("")
  const ownerSignatureRef = useRef<SignatureCanvasRef>(null)
  const cecSignatureRef = useRef<SignatureCanvasRef>(null)
  const isResettingRef = useRef(false) // Flag to prevent signature save during reset

  // Generate unique session ID for this tab/window
  const [sessionId] = useState(() => {
    // Only run on client side (browser)
    if (typeof window === 'undefined') {
      return 'ssr-placeholder' // Temporary ID for server-side rendering
    }
    
    // Check if we already have a session ID for this tab
    const existingSession = sessionStorage.getItem("FIRE_ALARM_SESSION_ID")
    if (existingSession) {
      console.log("🔄 Existing session found:", existingSession)
      return existingSession
    }
    // Generate new session ID for new tab
    const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem("FIRE_ALARM_SESSION_ID", newSession)
    console.log("🆕 New session created:", newSession)
    return newSession
  })

  // Update session ID once component mounts on client side
  useEffect(() => {
    if (sessionId === 'ssr-placeholder') {
      const existingSession = sessionStorage.getItem("FIRE_ALARM_SESSION_ID")
      if (existingSession) {
        console.log("🔄 Client-side session found:", existingSession)
      } else {
        const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem("FIRE_ALARM_SESSION_ID", newSession)
        console.log("🆕 Client-side session created:", newSession)
      }
    }
  }, [])

  const AUTOSAVE_KEY = `FIRE_ALARM_FORM_AUTOSAVE_${sessionId}`

  const form = useForm<FireAlarmFormData>({
    resolver: zodResolver(fireAlarmSchema),
    defaultValues: {
      // Section 1 - Property Information
      propertyName: "",
      street: "",
      cityStateZip: "",
      contact: "",
      phone: "",
      frequencyOfInspection: "Quarterly",
      date: "",

      // Section 2 - Notify Prior to Testing
      notifyEntities: [
        { entity: "", name: "", phone: "" },
        { entity: "", name: "", phone: "" },
        { entity: "", name: "", phone: "" },
        { entity: "", name: "", phone: "" },
        { entity: "", name: "", phone: "" },
      ],

      // Section 3 - Control Panel Status
      manufacturer: "",
      model: "",
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
        k: "Yes",
      },
      putSystemInTestAt: "",
      comments: "",

      // Section 4 - Equipment Tested
      systemType: "Addressable",
      equipmentTested: [
        {
          equipmentLabel: "A. Remote Annunciators",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "B. Manual Pull Stations",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "C. Photoelectric Type Smoke Detectors",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "D. Ionization Type Smoke Detectors",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "E. Heat, Thermal Detectors",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "F. Duct Smoke Detectors",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "G. Suppression Release Station",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "H. Abort Station",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "I. Alarm Horn/Strobe Unit",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "J. Alarm Horn Unit",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "K. Alarm Strobe Unit",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "L. Alarm Bell Unit",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "M. Sprinkler Water Flow Switch",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "N. Sprinkler Valve Tamper Switch",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "O. Sprinkler Pressure Switch",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "P. Sprinkler Dry System Low Air",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "Q. Sprinkler Fire Pump Run",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "R. Door Magnets",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "S. Elevator S.D. / H.D.",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "T. Total Initiating Zones Tested",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        },
        {
          equipmentLabel: "U. Total Indicating Zones Tested",
          totalNumber: 0,
          totalNumberTested: 0,
          tested: false,
          functionOK: "N/A"
        }
      ],

      // Section 5 - Functional Test of Output Devices
      functionalTest: {
        a: "Yes",
        b: "Yes",
        c: "Yes",
        d: "Yes",
        e: "Yes",
        f: "Yes",
      },

      // Section 5 - System Power Supplies
      primaryPower: "",
      nominalVoltage: "",
      nominalVoltageAmps: "",
      overcurrentProtection: "",
      overcurrentProtectionAmps: "",
      panelBreakerLocation: "",
      batteryTestReading: "",
      storageBattery: "",
      hoursSystemMustOperate: "",
      emergencyGeneratorConnected: false,
      fuelSourceLocation: "",

      // Section 7 - Post Test
      postTest: {
        a: "Yes",
        b: "Yes",
        c: "Yes",
        d: "Yes",
        e: "Yes",
      },
      returnToServiceAt: "",
      incorrectlyOperatingEquipment: "",

      // Section 9 - Sign-off Blocks
      testVerificationOwner: {
        name: "",
        title: "",
        signature: "",
        date: "",
      },
      testVerificationCEC: {
        name: "",
        title: "",
        signature: "",
        date: "",
      },
    },
  })

  const { fields: notifyFields, append: appendNotifyEntity } = useFieldArray({
    control: form.control,
    name: "notifyEntities",
  })

  const { fields: equipmentFields } = useFieldArray({
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

  // Manual save function - DO NOTHING TO SIGNATURES
  const manualSave = () => {
    console.log("💾 Manual save - saving form data only, NOT touching signatures")
    
    try {
      const formData = form.getValues()
      
      // Save form data (excluding signatures completely)
      const { testVerificationOwner, testVerificationCEC, ...dataWithoutSignatures } = formData
      const ownerWithoutSig = testVerificationOwner ? { ...testVerificationOwner, signature: "" } : undefined
      const cecWithoutSig = testVerificationCEC ? { ...testVerificationCEC, signature: "" } : undefined
      
      const dataToSave = {
        ...dataWithoutSignatures,
        ...(ownerWithoutSig && { testVerificationOwner: ownerWithoutSig }),
        ...(cecWithoutSig && { testVerificationCEC: cecWithoutSig })
      }
      
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave))
      console.log("💾 Form data saved successfully")
      
      setAutoSaveStatus("Form manually saved")
      setTimeout(() => setAutoSaveStatus(""), 2000)
      
    } catch (error) {
      console.error("Manual save failed:", error)
      setAutoSaveStatus("Manual save failed")
      setTimeout(() => setAutoSaveStatus(""), 3000)
    }
  }

  // Debug function to completely clear all data for this session
  const clearAllData = () => {
    if (confirm("CLEAR ALL DATA? This will remove everything including signatures and form data.")) {
      isResettingRef.current = true
      localStorage.removeItem(AUTOSAVE_KEY)
      localStorage.removeItem(SIGNATURE_KEY)
      sessionStorage.removeItem("FIRE_ALARM_SESSION_ID")
      console.log("All session data cleared")
      location.reload() // Reload page to start fresh
    }
  }

  // Function to clear form and localStorage
  const startNewForm = () => {
    if (confirm("Are you sure you want to start a new form? All current data including signatures will be permanently lost.")) {
      // Set flag to prevent signature saving during reset
      isResettingRef.current = true
      
      // Clear all localStorage data
      localStorage.removeItem(AUTOSAVE_KEY)
      localStorage.removeItem(SIGNATURE_KEY)
      
      // Reset form to default values
      form.reset({
        // Reset to completely empty form
        propertyName: "",
        street: "",
        cityStateZip: "",
        contact: "",
        phone: "",
        frequencyOfInspection: "",
        date: "",
        notifyEntities: [
          { entity: "", name: "", phone: "" },
          { entity: "", name: "", phone: "" },
          { entity: "", name: "", phone: "" },
          { entity: "", name: "", phone: "" },
          { entity: "", name: "", phone: "" },
        ],
        manufacturer: "",
        model: "",
        controlPanelStatus: {
          a: "", b: "", c: "", d: "", e: "", f: "",
          g: "", h: "", i: "", j: "", k: "",
        },
        putSystemInTestAt: "",
        comments: "",
        systemType: "",
        equipmentTested: equipmentFields.map((item: any) => ({
          equipmentLabel: item.equipmentLabel,
          totalNumber: 0,
          totalNumberTested: 0,
          functionOK: "",
        })),
        functionalTest: { a: "", b: "", c: "", d: "", e: "", f: "" },
        primaryPower: "",
        nominalVoltage: "",
        nominalVoltageAmps: "",
        overcurrentProtection: "",
        overcurrentProtectionAmps: "",
        panelBreakerLocation: "",
        batteryTestReading: "",
        storageBattery: "",
        hoursSystemMustOperate: "",
        emergencyGeneratorConnected: false,
        fuelSourceLocation: "",
        postTest: { a: "", b: "", c: "", d: "", e: "" },
        returnToServiceAt: "",
        incorrectlyOperatingEquipment: "",
        testVerificationOwner: { name: "", title: "", signature: "", date: "" },
        testVerificationCEC: { name: "", title: "", signature: "", date: "" },
      })
      
      // Clear signature canvases
      ownerSignatureRef.current?.clear()
      cecSignatureRef.current?.clear()
      
      // Reset the flag after clearing is complete
      setTimeout(() => {
        isResettingRef.current = false
      }, 100)
      
      setAutoSaveStatus("New form started - all data cleared")
      setTimeout(() => setAutoSaveStatus(""), 3000)
    }
  }

  // Function to fill form with random test data - PRESERVE SIGNATURES
  const fillTestData = () => {
    console.log("🔵 Fill Test Data - preserving signatures...")
    
    // Save current signatures before filling test data
    const currentOwnerSig = form.getValues("testVerificationOwner.signature") || ""
    const currentCecSig = form.getValues("testVerificationCEC.signature") || ""
    
    console.log("🔵 Current signatures before test data:", {
      owner: currentOwnerSig.length > 0 ? `${currentOwnerSig.length} chars` : "empty",
      cec: currentCecSig.length > 0 ? `${currentCecSig.length} chars` : "empty"
    })
    const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
    const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const randomDate = () => {
      const date = new Date()
      date.setDate(date.getDate() + randomNumber(-30, 30))
      return date.toISOString().split('T')[0]
    }
    const randomTime = () => {
      const hour = randomNumber(8, 17) // 8 AM to 5 PM in 24-hour format
      const minute = randomChoice(['00', '15', '30', '45'])
      return `${hour.toString().padStart(2, '0')}:${minute}` // HH:MM format for time inputs
    }
    
    const buildingNames = ["ABC Office Building", "Metro Business Center", "Sunrise Mall", "Downtown Tower", "Industrial Complex A"]
    const streets = ["123 Main Street", "456 Business Blvd", "789 Commerce Ave", "321 Industrial Way", "555 Corporate Dr"]
    const cities = ["Anytown, ST 12345", "Springfield, IL 62701", "Metro City, CA 90210", "Business Park, TX 75001", "Commerce, FL 33101"]
    const contacts = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "Tom Anderson"]
    const manufacturers = ["Fire-Lite", "Honeywell", "Edwards", "Simplex", "Notifier"]
    const models = ["MS-9600UDLS", "FACP-100", "EST3-100", "4100ES", "NFS2-3030"]
    
    const shortComments = [
      "All systems functioning normally.",
      "Minor issues resolved during testing.",
      "Regular maintenance completed.",
      "No faults detected."
    ]
    
    const mediumComments = [
      "All systems functioning normally during inspection. Control panel responded appropriately to all test signals. No faults or alarms detected during testing period.",
      "Systems tested according to NFPA standards. All notification devices activated as expected. Battery backup verified operational for required duration.",
      "Comprehensive testing completed. All smoke detectors responded within acceptable timeframes. Manual pull stations activated correctly.",
    ]
    
    const longComments = [
      "Complete fire alarm system inspection performed according to NFPA 72 standards. All smoke detectors tested with canned smoke and responded within acceptable timeframes. Manual pull stations activated correctly and sent proper signals to control panel. Horn/strobe devices operated at correct decibel levels and visibility patterns. Emergency communication systems tested and voice clarity confirmed. Battery backup system load tested for full 24-hour duration. All system components passed functional verification testing.",
      "Thorough inspection of all fire safety systems completed. Control panel diagnostics showed no errors or faults. All addressable devices responded properly to polling signals. Sprinkler flow switches and tamper switches tested and verified operational. Emergency generator connection tested under simulated power failure conditions. All notification appliances tested for proper sound levels and visual patterns. System restoration verified after testing completion.",
    ]
    
    const commentOptions = [...shortComments, ...mediumComments, ...longComments]
    
    form.reset({
      // Section 1
      propertyName: randomChoice(buildingNames),
      street: randomChoice(streets),
      cityStateZip: randomChoice(cities),
      contact: randomChoice(contacts),
      phone: `(${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}`,
      frequencyOfInspection: randomChoice(["Quarterly", "Semi-Annual", "Annual"]),
      date: randomDate(),
      
      // Section 2
      notifyEntities: [
        { entity: "Fire Department", name: `Station ${randomNumber(1, 5)}`, phone: `(${randomNumber(200, 999)}) ${randomNumber(911, 999)}-${randomNumber(1000, 9999)}` },
        { entity: "Security Company", name: randomChoice(["ABC Security", "Metro Safety", "Guardian Systems"]), phone: `(${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}` },
        { entity: "Building Manager", name: randomChoice(contacts), phone: `(${randomNumber(200, 999)}) ${randomNumber(200, 999)}-${randomNumber(1000, 9999)}` },
        { entity: "", name: "", phone: "" },
        { entity: "", name: "", phone: "" },
      ],
      
      // Section 3
      manufacturer: randomChoice(manufacturers),
      model: randomChoice(models),
      controlPanelStatus: {
        a: randomChoice(["Yes", "No", "N/A"]),
        b: randomChoice(["Yes", "No", "N/A"]),
        c: randomChoice(["Yes", "No", "N/A"]),
        d: randomChoice(["Yes", "No", "N/A"]),
        e: randomChoice(["Yes", "No", "N/A"]),
        f: randomChoice(["Yes", "No", "N/A"]),
        g: randomChoice(["Yes", "No", "N/A"]),
        h: randomChoice(["Yes", "No", "N/A"]),
        i: randomChoice(["Yes", "No", "N/A"]),
        j: randomChoice(["Yes", "No", "N/A"]),
        k: randomChoice(["Yes", "No", "N/A"]),
      },
      putSystemInTestAt: randomTime(),
      comments: randomChoice(commentOptions),
      
      // Section 4
      systemType: randomChoice(["Conventional", "Addressable"]),
      equipmentTested: equipmentFields.map((item: any) => {
        const totalNumber = randomNumber(0, 25)
        const totalTested = totalNumber > 0 ? randomNumber(0, totalNumber) : 0
        return {
          equipmentLabel: item.equipmentLabel,
          totalNumber: totalNumber,
          totalNumberTested: totalTested,
          functionOK: totalNumber > 0 ? randomChoice(["Yes", "No", "N/A"]) : "N/A",
        }
      }),
      
      // Section 5
      functionalTest: {
        a: randomChoice(["Yes", "No", "N/A"]),
        b: randomChoice(["Yes", "No", "N/A"]),
        c: randomChoice(["Yes", "No", "N/A"]),
        d: randomChoice(["Yes", "No", "N/A"]),
        e: randomChoice(["Yes", "No", "N/A"]),
        f: randomChoice(["Yes", "No", "N/A"]),
      },
      
      // Section 6
      primaryPower: `${randomNumber(110, 120)}VAC`,
      nominalVoltage: `${randomNumber(12, 24)}VDC`,
      nominalVoltageAmps: `${randomNumber(1, 10)}.${randomNumber(0, 9)}`,
      overcurrentProtection: `${randomNumber(10, 30)}A Circuit Breaker`,
      overcurrentProtectionAmps: randomNumber(10, 30).toString(),
      panelBreakerLocation: `Panel ${randomChoice(['A', 'B', 'C'])}, Breaker #${randomNumber(1, 20)}, ${randomChoice(['Basement', 'First Floor', 'Mechanical Room'])}`,
      batteryTestReading: `${randomNumber(24, 28)}.${randomNumber(0, 9)}VDC`,
      storageBattery: `${randomNumber(7, 25)}AH`,
      hoursSystemMustOperate: randomNumber(4, 72).toString(),
      emergencyGeneratorConnected: randomChoice([true, false]),
      fuelSourceLocation: randomChoice(["Diesel tank - basement", "Natural gas - exterior", "Propane tank - roof", "No generator"]),
      
      // Section 7
      postTest: {
        a: randomChoice(["Yes", "No", "N/A"]),
        b: randomChoice(["Yes", "No", "N/A"]),
        c: randomChoice(["Yes", "No", "N/A"]),
        d: randomChoice(["Yes", "No", "N/A"]),
        e: randomChoice(["Yes", "No", "N/A"]),
      },
      returnToServiceAt: randomTime(),
      incorrectlyOperatingEquipment: randomChoice(commentOptions),
      
      // Section 9
      testVerificationOwner: {
        name: randomChoice(contacts),
        title: randomChoice(["Building Manager", "Facility Manager", "Property Manager", "Maintenance Supervisor"]),
        signature: "",
        date: randomDate(),
      },
      testVerificationCEC: {
        name: randomChoice(["Mike Johnson", "Tom Wilson", "Sarah Davis", "John Anderson"]),
        title: "CEC Fire Safety Technician",
        signature: "",
        date: randomDate(),
      },
    })
    
    // Force form to trigger updates for all fields (especially dropdowns)
    setTimeout(() => {
      form.trigger() // This will force all fields to re-validate and update their display
    }, 100)
    
    // Restore signatures after test data is filled
    setTimeout(() => {
      if (currentOwnerSig) {
        console.log("🔵 Restoring owner signature after test data")
        form.setValue("testVerificationOwner.signature", currentOwnerSig)
        if (ownerSignatureRef.current) {
          ownerSignatureRef.current.loadSignature(currentOwnerSig)
        }
      }
      if (currentCecSig) {
        console.log("🔵 Restoring CEC signature after test data")
        form.setValue("testVerificationCEC.signature", currentCecSig)
        if (cecSignatureRef.current) {
          cecSignatureRef.current.loadSignature(currentCecSig)
        }
      }
    }, 500)
    
    setAutoSaveStatus("Test data filled")
    setTimeout(() => setAutoSaveStatus(""), 2000)
  }

  // Enhanced auto-save functionality (excludes signatures but saves everything else)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Don't trigger auto-save for signature field changes (signatures are saved separately)
      if (name && (
        name.includes('signature') || 
        name === 'testVerificationOwner.signature' || 
        name === 'testVerificationCEC.signature' ||
        name.endsWith('.signature')
      )) {
        return
      }
      
      // Debounce the save operation - reduced to 300ms for faster saving
      const timeoutId = setTimeout(() => {
        try {
          // Exclude signature fields from auto-save (they're handled separately)
          const { testVerificationOwner, testVerificationCEC, ...dataWithoutSignatures } = value
          const ownerWithoutSig = testVerificationOwner ? { ...testVerificationOwner, signature: "" } : undefined
          const cecWithoutSig = testVerificationCEC ? { ...testVerificationCEC, signature: "" } : undefined
          
          const dataToSave = {
            ...dataWithoutSignatures,
            ...(ownerWithoutSig && { testVerificationOwner: ownerWithoutSig }),
            ...(cecWithoutSig && { testVerificationCEC: cecWithoutSig })
          }
          
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave))
          console.log("Form auto-saved at:", new Date().toLocaleTimeString())
          setAutoSaveStatus("Form auto-saved")
          
          // Clear status after 1.5 seconds
          setTimeout(() => setAutoSaveStatus(""), 1500)
        } catch (error) {
          console.error("Failed to auto-save form data:", error)
          setAutoSaveStatus("Auto-save failed")
          setTimeout(() => setAutoSaveStatus(""), 3000)
        }
      }, 300) // 300ms debounce for faster saving

      return () => clearTimeout(timeoutId)
    })

    return () => subscription.unsubscribe()
  }, [form])

  // Signature persistence (separate from form auto-save)
  const SIGNATURE_KEY = `FIRE_ALARM_SIGNATURES_${sessionId}`
  
  // Simple function to save signatures - only used during startup/restore
  const ensureSignaturesSaved = () => {
    // Don't save signatures during form reset
    if (isResettingRef.current) return
    
    const ownerSig = form.getValues("testVerificationOwner.signature") || ""
    const cecSig = form.getValues("testVerificationCEC.signature") || ""
    
    if (ownerSig || cecSig) {
      const signatures = { owner: ownerSig, cec: cecSig }
      localStorage.setItem(SIGNATURE_KEY, JSON.stringify(signatures))
      console.log("Ensured signatures are saved")
    }
  }
  
  // Restore signatures from localStorage - AGGRESSIVE restoration
  const restoreSignatures = () => {
    const savedSignatures = localStorage.getItem(SIGNATURE_KEY)
    if (!savedSignatures) {
      console.log("No saved signatures found")
      return
    }
    
    try {
      const signatures = JSON.parse(savedSignatures)
      console.log("Found saved signatures:", { 
        owner: signatures.owner ? `${signatures.owner.length} chars` : "empty",
        cec: signatures.cec ? `${signatures.cec.length} chars` : "empty"
      })
      
      // Restore owner signature if it exists and is substantial
      if (signatures.owner && signatures.owner.length > 100) {
        console.log("Restoring owner signature to canvas")
        form.setValue("testVerificationOwner.signature", signatures.owner)
        
        // Multiple attempts with different delays
        setTimeout(() => {
          if (ownerSignatureRef.current) {
            console.log("Owner signature restore attempt at 100ms")
            ownerSignatureRef.current.loadSignature(signatures.owner)
          }
        }, 100)
        setTimeout(() => {
          if (ownerSignatureRef.current) {
            console.log("Owner signature restore attempt at 500ms")
            ownerSignatureRef.current.loadSignature(signatures.owner)
          }
        }, 500)
        setTimeout(() => {
          if (ownerSignatureRef.current) {
            console.log("Owner signature restore attempt at 1000ms")
            ownerSignatureRef.current.loadSignature(signatures.owner)
          }
        }, 1000)
        setTimeout(() => {
          if (ownerSignatureRef.current) {
            console.log("Owner signature restore attempt at 1500ms")
            ownerSignatureRef.current.loadSignature(signatures.owner)
          }
        }, 1500)
      }
      
      // Restore CEC signature if it exists and is substantial
      if (signatures.cec && signatures.cec.length > 100) {
        console.log("Restoring CEC signature to canvas")
        form.setValue("testVerificationCEC.signature", signatures.cec)
        
        // Multiple attempts with different delays
        setTimeout(() => {
          if (cecSignatureRef.current) {
            console.log("CEC signature restore attempt at 100ms")
            cecSignatureRef.current.loadSignature(signatures.cec)
          }
        }, 100)
        setTimeout(() => {
          if (cecSignatureRef.current) {
            console.log("CEC signature restore attempt at 500ms")
            cecSignatureRef.current.loadSignature(signatures.cec)
          }
        }, 500)
        setTimeout(() => {
          if (cecSignatureRef.current) {
            console.log("CEC signature restore attempt at 1000ms")
            cecSignatureRef.current.loadSignature(signatures.cec)
          }
        }, 1000)
        setTimeout(() => {
          if (cecSignatureRef.current) {
            console.log("CEC signature restore attempt at 1500ms")
            cecSignatureRef.current.loadSignature(signatures.cec)
          }
        }, 1500)
      }
    } catch (error) {
      console.error("Failed to restore signatures:", error)
      // Clear corrupted signature data
      localStorage.removeItem(SIGNATURE_KEY)
    }
  }

  // Load saved form data on component mount
  const loadSavedFormData = () => {
    const savedData = localStorage.getItem(AUTOSAVE_KEY)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        console.log("Loading saved form data:", parsedData)
        
        // Reset form with saved data, preserving the structure
        form.reset({
          ...parsedData,
          // Ensure signatures are empty in the form reset (they'll be loaded separately)
          testVerificationOwner: {
            ...parsedData.testVerificationOwner,
            signature: ""
          },
          testVerificationCEC: {
            ...parsedData.testVerificationCEC,
            signature: ""
          }
        })
        
        // Force form to trigger updates for all fields
        setTimeout(() => {
          form.trigger()
        }, 100)
        
        // Only show restoration message if there's meaningful data
        const hasRealData = Object.values(parsedData).some(value => {
          if (typeof value === 'string') return value.trim().length > 0
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v => typeof v === 'string' && v.trim().length > 0)
          }
          return false
        })
        
        if (hasRealData) {
          setAutoSaveStatus("Form data restored")
          setTimeout(() => setAutoSaveStatus(""), 2000)
        }
      } catch (error) {
        console.error("Failed to load saved form data:", error)
      }
    }
  }

  // Call this function when component mounts
  React.useEffect(() => {
    // Clear any random test data on first load
    console.log("Component mounting - checking for saved data")
    
    loadSavedFormData() // Load saved form data first
    ensurePhoneFormatting()
    
    // Restore signatures with longer delay and multiple attempts
    setTimeout(() => {
      console.log("First signature restore attempt")
      restoreSignatures()
    }, 1000)
    
    // Second attempt to ensure signatures stick
    setTimeout(() => {
      console.log("Second signature restore attempt")
      restoreSignatures()
    }, 2000)
    
    // Third attempt to be absolutely sure
    setTimeout(() => {
      console.log("Final signature restore attempt")
      restoreSignatures()
    }, 3000)
    
    // Simple signature guard - runs every 3 seconds
    const signatureGuard = setInterval(() => {
      const savedSigs = localStorage.getItem(SIGNATURE_KEY)
      if (savedSigs) {
        try {
          const sigs = JSON.parse(savedSigs)
          
          // If we have saved signatures, ensure they're visible
          if (sigs.owner && sigs.owner.length > 100 && ownerSignatureRef.current) {
            const current = ownerSignatureRef.current.getSignature()
            if (!current || current.length < 100) {
              console.log("🔄 Restoring owner signature (guard)")
              ownerSignatureRef.current.loadSignature(sigs.owner)
            }
          }
          
          if (sigs.cec && sigs.cec.length > 100 && cecSignatureRef.current) {
            const current = cecSignatureRef.current.getSignature()
            if (!current || current.length < 100) {
              console.log("🔄 Restoring CEC signature (guard)")
              cecSignatureRef.current.loadSignature(sigs.cec)
            }
          }
        } catch (e) {
          console.error("Signature guard error:", e)
        }
      }
    }, 3000)
    
    return () => clearInterval(signatureGuard)
  }, [])

  const generatePDF = async () => {
    console.log("📄 PDF generation - NOT touching signatures")
    setIsGeneratingPDF(true)
    setError(null)

    try {
      console.log("Starting PDF generation...")
      const formData = form.getValues()

      // Validate form data before sending to server
      const validationResult = form.trigger()
      if (!validationResult) {
        throw new Error("Form validation failed. Please check all required fields.")
      }

      console.log("Form validation passed, sending to server...")
      const result = await handleSubmitServer(formData)
      console.log("Server result:", result)

      if (result.success && result.pdfBytes) {
        console.log("PDF bytes received, size:", result.pdfBytes.length)
        const pdfBytes = new Uint8Array(result.pdfBytes)
        const date = new Date().toISOString().split("T")[0]
        const propertyName = formData.propertyName.replace(/[^a-zA-Z0-9]/g, "_")
        const filename = `Fire_Alarm_Report_${propertyName}_${date}.pdf`

        console.log("📄 PDF generation completed successfully")
        return { pdfBytes, filename, formData }
      } else {
        console.error("Server returned error:", result)
        throw new Error(result.message || result.error || "Unknown error occurred")
      }
    } catch (error) {
      console.error("PDF generation error:", error)
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred while generating the PDF."
      setError(errorMessage)
      return null
    } finally {
      setIsGeneratingPDF(false)
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
      <header className="sticky top-0 z-50 bg-black border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <Image
              src="/cec-logo.png"
              alt="Custom Electric & Communications Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
            {/* Auto-save status indicator */}
            {autoSaveStatus && (
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{autoSaveStatus}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="text-white">
            {theme === "light" ? <Moon className="h-5 w-5 text-white" /> : <Sun className="h-5 w-5 text-white" />}
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

        {/* Auto-save status for mobile (when not visible in header) */}
        {autoSaveStatus && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <AlertDescription>{autoSaveStatus}</AlertDescription>
            </div>
          </Alert>
        )}

        <form className="space-y-12">
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
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 2 — Notify Prior to Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {notifyFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Entity</Label>
                      <Input
                        {...form.register(`notifyEntities.${index}.entity`)}
                        placeholder="e.g., Owner/Rep, Fire Department"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Name</Label>
                      <Input
                        {...form.register(`notifyEntities.${index}.name`)}
                        placeholder="Contact name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <Input
                        {...form.register(`notifyEntities.${index}.phone`)}
                        placeholder="(###) ###-####"
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          form.setValue(`notifyEntities.${index}.phone`, formatted)
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => appendNotifyEntity({ entity: "", name: "", phone: "" })}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  + Add Entity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 - Control Panel Status */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 3 — Control Panel Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Manufacturer and Model Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="manufacturer" className="text-sm font-medium text-gray-700">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      {...form.register("manufacturer")}
                      placeholder="e.g., Simplex, Notifier, Edwards"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model" className="text-sm font-medium text-gray-700">Model</Label>
                    <Input
                      id="model"
                      {...form.register("model")}
                      placeholder="e.g., 4100U, 4020, EST3"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Control Panel Status Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Questions A-E */}
                  <div className="space-y-4">
                    {controlPanelQuestions.slice(0, 5).map((question, index) => {
                      const key = String.fromCharCode(97 + index) as keyof typeof form.getValues("controlPanelStatus")
                      return (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            {question}
                          </Label>
                          <RadioGroup
                            value={form.watch(`controlPanelStatus.${key}`)}
                            onValueChange={(value) =>
                              form.setValue(`controlPanelStatus.${key}`, value as "Yes" | "No" | "N/A")
                            }
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Yes" id={`${key}-yes`} />
                              <Label htmlFor={`${key}-yes`}>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="No" id={`${key}-no`} />
                              <Label htmlFor={`${key}-no`}>No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="N/A" id={`${key}-na`} />
                              <Label htmlFor={`${key}-na`}>N/A</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )
                    })}
                  </div>

                  {/* Right Column - Questions F-K */}
                  <div className="space-y-4">
                    {controlPanelQuestions.slice(5).map((question, index) => {
                      const key = String.fromCharCode(97 + index + 5) as keyof typeof form.getValues("controlPanelStatus")
                      return (
                        <div key={index + 5} className="p-4 border rounded-lg bg-gray-50">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            {question}
                          </Label>
                          <RadioGroup
                            value={form.watch(`controlPanelStatus.${key}`)}
                            onValueChange={(value) =>
                              form.setValue(`controlPanelStatus.${key}`, value as "Yes" | "No" | "N/A")
                            }
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Yes" id={`${key}-yes`} />
                              <Label htmlFor={`${key}-yes`}>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="No" id={`${key}-no`} />
                              <Label htmlFor={`${key}-no`}>No</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="N/A" id={`${key}-na`} />
                              <Label htmlFor={`${key}-na`}>N/A</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="putSystemInTestAt" className="text-sm font-medium text-gray-700">System Put in Test At *</Label>
                    <Input
                      id="putSystemInTestAt"
                      type="time"
                      {...form.register("putSystemInTestAt")}
                      className={`mt-1 ${form.formState.errors.putSystemInTestAt ? "border-red-500" : ""}`}
                    />
                    {form.formState.errors.putSystemInTestAt && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.putSystemInTestAt.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments" className="text-sm font-medium text-gray-700">Comments</Label>
                  <textarea
                    id="comments"
                    {...form.register("comments")}
                    className="w-full p-3 border rounded-lg resize-none mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Additional comments..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 - Equipment Tested */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 4 — Equipment Tested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System Type Field */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">System Type</Label>
                  <RadioGroup
                    value={form.watch("systemType")}
                    onValueChange={(value) => form.setValue("systemType", value as "Conventional" | "Addressable")}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Conventional" id="system-conventional" />
                      <Label htmlFor="system-conventional">Conventional</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Addressable" id="system-addressable" />
                      <Label htmlFor="system-addressable">Addressable</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Equipment Tested Table */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-4 block">Equipment Tested</Label>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left font-medium">Equipment</th>
                          <th className="border border-gray-300 p-3 text-center font-medium">Total Number</th>
                          <th className="border border-gray-300 p-3 text-center font-medium">Tested</th>
                          <th className="border border-gray-300 p-3 text-center font-medium">Device Function</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentFields.map((item, index) => (
                          <tr key={index} className="border-b border-gray-300 hover:bg-gray-50">
                            <td className="border border-gray-300 p-3">
                              <Input
                                {...form.register(`equipmentTested.${index}.equipmentLabel`)}
                                className="border-0 p-0 bg-transparent focus:ring-0"
                              />
                            </td>
                            <td className="border border-gray-300 p-3">
                              <Input
                                type="number"
                                {...form.register(`equipmentTested.${index}.totalNumber`, { valueAsNumber: true })}
                                className="border-0 p-0 text-center bg-transparent focus:ring-0"
                              />
                            </td>
                            <td className="border border-gray-300 p-3">
                              <Input
                                type="number"
                                {...form.register(`equipmentTested.${index}.totalNumberTested`, { valueAsNumber: true })}
                                className="border-0 p-0 text-center bg-transparent focus:ring-0"
                              />
                            </td>
                            <td className="border border-gray-300 p-3">
                              <Select
                                value={form.watch(`equipmentTested.${index}.functionOK`)}
                                onValueChange={(value) => form.setValue(`equipmentTested.${index}.functionOK`, value)}
                              >
                                <SelectTrigger className="border-0 p-0 text-center w-full bg-transparent focus:ring-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                  <SelectItem value="N/A">N/A</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 - Functional Test */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 5 — Functional Test of Output Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {functionalTestQuestions.map((question, index) => {
                  const key = String.fromCharCode(97 + index) as keyof typeof form.getValues("functionalTest")
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                      <Label className="text-sm font-medium text-gray-700 flex-1">{question}</Label>
                      <RadioGroup
                        value={form.watch(`functionalTest.${key}`)}
                        onValueChange={(value) => form.setValue(`functionalTest.${key}`, value as any)}
                        className="flex gap-3 ml-4"
                      >
                        {["Yes", "No", "N/A"].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`func-${key}-${option}`} className="w-4 h-4" />
                            <Label htmlFor={`func-${key}-${option}`} className="text-sm font-medium">{option}</Label>
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
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 6 — System Power Supplies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Power Supply Fields */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="primaryPower" className="text-sm font-medium text-gray-700">Primary Power</Label>
                    <Input
                      id="primaryPower"
                      {...form.register("primaryPower")}
                      placeholder="Enter primary power"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nominalVoltage" className="text-sm font-medium text-gray-700">Nominal Voltage</Label>
                      <div className="flex items-center mt-1 gap-2">
                        <Input
                          id="nominalVoltage"
                          {...form.register("nominalVoltage")}
                          placeholder="Enter voltage"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">Amps</span>
                        <Input
                          {...form.register("nominalVoltageAmps")}
                          placeholder=""
                          className="w-20"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="overcurrentProtection" className="text-sm font-medium text-gray-700">Overcurrent Protection</Label>
                      <div className="flex items-center mt-1 gap-2">
                        <Input
                          id="overcurrentProtection"
                          {...form.register("overcurrentProtection")}
                          placeholder="Enter protection"
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 whitespace-nowrap">Amps</span>
                        <Input
                          {...form.register("overcurrentProtectionAmps")}
                          placeholder=""
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="panelBreakerLocation" className="text-sm font-medium text-gray-700">Panel, Breaker No. & Location</Label>
                    <Input
                      id="panelBreakerLocation"
                      {...form.register("panelBreakerLocation")}
                      placeholder="Enter panel/breaker info"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="batteryTestReading" className="text-sm font-medium text-gray-700">Battery Test Reading</Label>
                    <Textarea
                      id="batteryTestReading"
                      {...form.register("batteryTestReading")}
                      placeholder="Enter battery reading details"
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="storageBattery" className="text-sm font-medium text-gray-700">Storage Battery (Amp Hour Rating)</Label>
                      <Input
                        id="storageBattery"
                        {...form.register("storageBattery")}
                        placeholder="Enter battery rating"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hoursSystemMustOperate" className="text-sm font-medium text-gray-700">Calculated to operate system for (Hours)</Label>
                      <Input
                        id="hoursSystemMustOperate"
                        {...form.register("hoursSystemMustOperate")}
                        placeholder="Enter hours"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Is fire alarm system connected to an emergency generator?
                    </Label>
                    <RadioGroup
                      value={form.watch("emergencyGeneratorConnected") ? "Yes" : "No"}
                      onValueChange={(value) => form.setValue("emergencyGeneratorConnected", value === "Yes")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="generator-yes" />
                        <Label htmlFor="generator-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="generator-no" />
                        <Label htmlFor="generator-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="fuelSourceLocation" className="text-sm font-medium text-gray-700">Location of Fuel Source</Label>
                    <Input
                      id="fuelSourceLocation"
                      {...form.register("fuelSourceLocation")}
                      placeholder="Enter fuel source location"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 - Post Test */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 7 — Post Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {postTestQuestions.map((question, index) => {
                  const key = String.fromCharCode(97 + index) as keyof typeof form.getValues("postTest")
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                      <Label className="text-sm font-medium text-gray-700 flex-1">{question}</Label>
                      <RadioGroup
                        value={form.watch(`postTest.${key}`)}
                        onValueChange={(value) => form.setValue(`postTest.${key}`, value as any)}
                        className="flex gap-3 ml-4"
                      >
                        {["Yes", "No", "N/A"].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`post-${key}-${option}`} className="w-4 h-4" />
                            <Label htmlFor={`post-${key}-${option}`} className="text-sm font-medium">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )
                })}

                <div>
                  <Label htmlFor="returnToServiceAt" className="text-sm font-medium text-gray-700">System Returned to Service At *</Label>
                  <Input
                    id="returnToServiceAt"
                    type="time"
                    {...form.register("returnToServiceAt")}
                    className={`mt-1 ${form.formState.errors.returnToServiceAt ? "border-red-500" : ""}`}
                  />
                  {form.formState.errors.returnToServiceAt && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.returnToServiceAt.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 8 - Comments */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 8 — Incorrectly Operating Equipment / Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="incorrectlyOperatingEquipment" className="text-sm font-medium text-gray-700">Comments</Label>
                <textarea
                  id="incorrectlyOperatingEquipment"
                  {...form.register("incorrectlyOperatingEquipment")}
                  className="w-full p-3 border rounded-lg resize-none mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Describe any incorrectly operating equipment or additional comments..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 9 - Sign-off */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#144C84" }}>Section 9 — Sign-off Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Owner Verification */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Test Verification - Owner</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">Name *</Label>
                      <Input
                        id="ownerName"
                        {...form.register("testVerificationOwner.name")}
                        className={`mt-1 ${form.formState.errors.testVerificationOwner?.name ? "border-red-500" : ""}`}
                      />
                      {form.formState.errors.testVerificationOwner?.name && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.testVerificationOwner.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="ownerTitle" className="text-sm font-medium text-gray-700">Title *</Label>
                      <Input
                        id="ownerTitle"
                        {...form.register("testVerificationOwner.title")}
                        className={`mt-1 ${form.formState.errors.testVerificationOwner?.title ? "border-red-500" : ""}`}
                      />
                      {form.formState.errors.testVerificationOwner?.title && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.testVerificationOwner.title.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Signature *</Label>
                      <SignatureCanvas
                        ref={ownerSignatureRef}
                        value={form.watch("testVerificationOwner.signature")}
                        onSignatureChange={(signature) => {
                          console.log("🖊️ Owner signature drawn, length:", signature.length)
                          form.setValue("testVerificationOwner.signature", signature)
                          const currentCec = form.getValues("testVerificationCEC.signature") || ""
                          const signatures = { owner: signature, cec: currentCec }
                          localStorage.setItem(SIGNATURE_KEY, JSON.stringify(signatures))
                          console.log("🖊️ Owner signature SAVED to localStorage")
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerDate" className="text-sm font-medium text-gray-700">Date *</Label>
                      <Input
                        id="ownerDate"
                        type="date"
                        {...form.register("testVerificationOwner.date")}
                        className={`mt-1 ${form.formState.errors.testVerificationOwner?.date ? "border-red-500" : ""}`}
                      />
                      {form.formState.errors.testVerificationOwner?.date && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.testVerificationOwner.date.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* CEC Verification */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Test Verification - CEC</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="cecName" className="text-sm font-medium text-gray-700">Name *</Label>
                      <Input
                        id="cecName"
                        {...form.register("testVerificationCEC.name")}
                        className={`mt-1 ${form.formState.errors.testVerificationCEC?.name ? "border-red-500" : ""}`}
                      />
                      {form.formState.errors.testVerificationCEC?.name && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.testVerificationCEC.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="cecTitle" className="text-sm font-medium text-gray-700">Title *</Label>
                      <Input
                        id="cecTitle"
                        {...form.register("testVerificationCEC.title")}
                        className={`mt-1 ${form.formState.errors.testVerificationCEC?.title ? "border-red-500" : ""}`}
                      />
                      {form.formState.errors.testVerificationCEC?.title && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.testVerificationCEC.title.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Signature *</Label>
                      <SignatureCanvas
                        ref={cecSignatureRef}
                        value={form.watch("testVerificationCEC.signature")}
                        onSignatureChange={(signature) => {
                          console.log("🖊️ CEC signature drawn, length:", signature.length)
                          form.setValue("testVerificationCEC.signature", signature)
                          const currentOwner = form.getValues("testVerificationOwner.signature") || ""
                          const signatures = { owner: currentOwner, cec: signature }
                          localStorage.setItem(SIGNATURE_KEY, JSON.stringify(signatures))
                          console.log("🖊️ CEC signature SAVED to localStorage")
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cecDate" className="text-sm font-medium text-gray-700">Date *</Label>
                      <Input
                        id="cecDate"
                        type="date"
                        {...form.register("testVerificationCEC.date")}
                        className={`mt-1 ${form.formState.errors.testVerificationCEC?.date ? "border-red-500" : ""}`}
                      />
                      {form.formState.errors.testVerificationCEC?.date && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.testVerificationCEC.date.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                onClick={manualSave}
                disabled={isGeneratingPDF}
                variant="outline"
                className="flex-1 sm:flex-none px-6 py-3 font-semibold bg-green-50 border-green-200 text-green-700 hover:bg-green-100 min-h-[44px] touch-manipulation"
              >
                💾 Save Form
              </Button>
              <Button
                type="button"
                onClick={handleSavePDF}
                disabled={isGeneratingPDF}
                variant="outline"
                className="flex-1 sm:flex-none px-6 py-3 font-semibold bg-transparent min-h-[44px] touch-manipulation"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Save PDF"}
              </Button>
              <Button
                type="button"
                onClick={handleSharePDF}
                disabled={isGeneratingPDF}
                className="flex-1 sm:flex-none px-6 py-3 font-semibold min-h-[44px] touch-manipulation"
                style={{ backgroundColor: "#144C84", color: "#fff" }}
              >
                <Share className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Share PDF"}
              </Button>
              
              <Button
                type="button"
                onClick={startNewForm}
                disabled={isGeneratingPDF}
                variant="destructive"
                className="flex-1 sm:flex-none px-6 py-3 font-semibold min-h-[44px] touch-manipulation"
              >
                Start New Form
              </Button>
              
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
