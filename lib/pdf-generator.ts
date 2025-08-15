import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { FireAlarmFormData } from "./validation"

export async function generateFireAlarmPDF(data: FireAlarmFormData): Promise<Uint8Array> {
  try {
    console.log("Creating PDF document...")
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792])
    const { width, height } = page.getSize()
    console.log("PDF page size:", width, "x", height)

    console.log("Embedding fonts...")
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    console.log("Fonts embedded successfully")

    console.log("Embedding company logo...")
    const candidateFiles = ['cec-logo.png', 'cec-logo.jpg', 'logo.png', 'logo.jpg']
    let logoImage: any | null = null
    let logoDims: any | null = null

    // Try reading from local filesystem first (works in local dev / some server envs)
    try {
      const fs = await import('fs')
      const path = await import('path')
      for (const file of candidateFiles) {
        try {
          const p = path.join(process.cwd(), 'public', file)
          if (!fs.existsSync(p)) continue
          const bytes = fs.readFileSync(p)
          if (file.endsWith('.png')) {
            logoImage = await pdfDoc.embedPng(bytes)
          } else {
            logoImage = await pdfDoc.embedJpg(bytes)
          }
          console.log(`Embedded logo from local file ${file}`)
          break
        } catch (e) {
          console.log(`Failed to embed local ${file}, trying next...`)
        }
      }
    } catch {
      // fs/path may not be available in some edge/serverless runtimes
      console.log('Local fs not available, will try fetching logo over HTTP')
    }

    // If not found via fs, try fetching from a public URL (works on Vercel)
    if (!logoImage) {
      const baseCandidates = [
        process.env.NEXT_PUBLIC_SITE_URL || '',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        'http://localhost:3000',
      ].filter(Boolean) as string[]

      for (const file of candidateFiles) {
        for (const base of baseCandidates) {
          const url = `${base}/${file}`
          try {
            const res = await fetch(url)
            if (res.ok) {
              const arr = new Uint8Array(await res.arrayBuffer())
              if (file.endsWith('.png')) {
                logoImage = await pdfDoc.embedPng(arr)
              } else {
                logoImage = await pdfDoc.embedJpg(arr)
              }
              console.log(`Embedded logo from URL ${url}`)
              break
            }
          } catch (e) {
            console.log(`Failed to fetch ${url}, trying next...`)
          }
        }
        if (logoImage) break
      }
    }

    if (logoImage) {
      logoDims = logoImage.scale(0.35)
      console.log("Logo embedded successfully")
    } else {
      console.warn('Logo not found; continuing without embedding logo')
    }

    const primaryColor = rgb(0.078, 0.298, 0.518)
    const darkGray = rgb(0.3, 0.3, 0.3)
    const green = rgb(0, 0.7, 0)
    let yPosition = height - 60

    // Helper functions
    const sanitizeText = (text: string): string => {
      if (!text) return ""
      return text.replace(/[\r\n\t]/g, ' ')
                .replace(/[^\x20-\x7E]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
    }

    const addText = (text: string, x: number, y: number, size: number = 10, bold: boolean = false, color = rgb(0, 0, 0)) => {
      const sanitized = sanitizeText(text)
      page.drawText(sanitized, {
        x, y, size,
        font: bold ? boldFont : font,
        color
      })
    }

    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      if (!text) return []
      const sanitized = sanitizeText(text)
      const words = sanitized.split(' ')
      const lines: string[] = []
      let currentLine = ''

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const testWidth = font.widthOfTextAtSize(testLine, fontSize)
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      })
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines
    }

    const checkPage = (spaceNeeded: number = 100) => {
      if (yPosition - spaceNeeded < 50) {
        page = pdfDoc.addPage([612, 792])
        yPosition = height - 50  // Start closer to top for minimal spacing
      }
    }

    const drawQuestionWithAnswer = (question: string, answer: string, x: number, y: number) => {
      addText(question, x, y, 9)
      const optionsX = 380
      const spacing = 35
      
      if (answer === "Yes") {
        page.drawRectangle({ x: optionsX - 3, y: y - 2, width: 26, height: 12, borderColor: green, borderWidth: 1.5 })
        page.drawText("Yes", { x: optionsX, y: y, size: 10, font: boldFont, color: green })
      } else {
        addText("Yes", optionsX, y, 9)
      }
      
      if (answer === "No") {
        page.drawRectangle({ x: optionsX + spacing - 3, y: y - 2, width: 22, height: 12, borderColor: green, borderWidth: 1.5 })
        page.drawText("No", { x: optionsX + spacing, y: y, size: 10, font: boldFont, color: green })
      } else {
        addText("No", optionsX + spacing, y, 9)
      }
      
      if (answer === "N/A") {
        page.drawRectangle({ x: optionsX + (spacing * 2) - 3, y: y - 2, width: 24, height: 12, borderColor: green, borderWidth: 1.5 })
        page.drawText("N/A", { x: optionsX + (spacing * 2), y: y, size: 10, font: boldFont, color: green })
      } else {
        addText("N/A", optionsX + (spacing * 2), y, 9)
      }
    }

    // Header with centered logo and title
    if (logoImage && logoDims) {
      const logoX = (width - logoDims.width) / 2
      page.drawImage(logoImage, {
        x: logoX,
        y: height - 70,
        width: logoDims.width,
        height: logoDims.height
      })
    }

    const title = sanitizeText("Fire Alarm Inspection & Test Report")
    const titleWidth = timesFont.widthOfTextAtSize(title, 16)
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 100,
      size: 16,
      font: timesFont,
      color: primaryColor
    })

    yPosition = height - 130

    // Section 1 - Property Information
    addText("Section 1 - Property Information", 50, yPosition, 12, true, primaryColor)
    yPosition -= 15
    
    // Two-column layout for Section 1
    const leftColumn = [
      ["Property Name:", data.propertyName || ""],
      ["Street:", data.street || ""],
      ["Contact:", data.contact || ""]
    ]
    const rightColumn = [
      ["City, State, Zip:", data.cityStateZip || ""],
      ["Phone:", data.phone || ""],
      ["Date:", data.date || ""]
    ]

    const section1StartY = yPosition
    for (let i = 0; i < Math.max(leftColumn.length, rightColumn.length); i++) {
      if (leftColumn[i]) {
        addText(leftColumn[i][0], 55, yPosition, 9, true)
        addText(leftColumn[i][1], 140, yPosition, 9)
      }
      if (rightColumn[i]) {
        addText(rightColumn[i][0], 320, yPosition, 9, true)
        addText(rightColumn[i][1], 420, yPosition, 9)
      }
      yPosition -= 12
    }

    yPosition = section1StartY - 60

    // Section 2 - Notify Prior to Testing
    addText("Section 2 - Notify Prior to Testing", 50, yPosition, 12, true, primaryColor)
    yPosition -= 15

    // Two-column layout for notify entities
    if (data.notifyEntities) {
      const validEntities = data.notifyEntities.filter(entity => entity?.entity && entity.entity.trim())
      for (let i = 0; i < validEntities.length; i += 2) {
        const left = validEntities[i]
        const right = validEntities[i + 1]
        
        if (left) {
          addText(`${left.entity}: ${left.name} (${left.phone})`, 55, yPosition, 9)
        }
        if (right) {
          addText(`${right.entity}: ${right.name} (${right.phone})`, 320, yPosition, 9)
        }
        yPosition -= 12
      }
    }

    yPosition -= 15

    // Section 3 - Control Panel Status
    addText("Section 3 - Control Panel Status", 50, yPosition, 12, true, primaryColor)
    yPosition -= 15
    
    addText(`Manufacturer: ${data.manufacturer || ""}`, 55, yPosition, 9)
    addText(`Model: ${data.model || ""}`, 320, yPosition, 9)
    yPosition -= 15

    const controlQuestions = [
      "A. Is panel monitored by outside agency?",
      "B. Is the power light on?",
      "C. Is the trouble light on?",
      "D. Is the alarm light on?",
      "E. Is the supervisory light on?",
      "F. Is the ground fault light on?",
      "G. Is the AC power on?",
      "H. Is the system in normal operation?",
      "I. Does the panel have battery backup?",
      "J. Do the batteries indicate proper charge?",
      "K. Have Fire Dept. and Monitoring Agency been notified?"
    ]

    controlQuestions.forEach((question, index) => {
      const key = String.fromCharCode(97 + index) as keyof typeof data.controlPanelStatus
      const answer = data.controlPanelStatus?.[key] || "N/A"
      drawQuestionWithAnswer(question, answer, 55, yPosition)
      yPosition -= 15
    })

    addText(`System Put in Test At: ${data.putSystemInTestAt || ""}`, 55, yPosition, 9, true)
    yPosition -= 20

    // Comments section with text wrapping
    if (data.comments) {
      addText("Comments:", 55, yPosition, 9, true)
      yPosition -= 12
      const commentLines = wrapText(data.comments, 500, 9)
      commentLines.forEach(line => {
        checkPage(15)
        addText(line, 55, yPosition, 9)
        yPosition -= 12
      })
    }

    yPosition -= 15

    // Manual page break before Section 4
    page = pdfDoc.addPage([612, 792])
    yPosition = height - 50

    // Section 4 - Equipment Tested
    addText("Section 4 - Equipment Tested", 50, yPosition, 12, true, primaryColor)
    yPosition -= 20

    addText(`System Type: ${data.systemType || ""}`, 55, yPosition, 9)
    yPosition -= 20

    // Table headers
    const headers = ["Equipment", "Total Number", "Total No. Tested", "Device Function"]
    let xPos = 50
    headers.forEach(header => {
      page.drawRectangle({
        x: xPos - 2,
        y: yPosition - 15,
        width: 125,
        height: 20,
        color: primaryColor
      })
      addText(header, xPos + 5, yPosition - 8, 9, true, rgb(1, 1, 1))
      xPos += 125
    })
    yPosition -= 25

    // Table rows
    if (data.equipmentTested) {
      data.equipmentTested.forEach((item: any) => {
        if (item.equipmentLabel) {
          xPos = 50
          const values = [
            item.equipmentLabel,
            item.totalNumber?.toString() || "0",
            item.totalNumberTested?.toString() || "0",
            item.functionOK || "N/A"
          ]
          values.forEach(value => {
            page.drawRectangle({
              x: xPos - 2,
              y: yPosition - 15,
              width: 125,
              height: 20,
              borderColor: darkGray,
              borderWidth: 0.5
            })
            addText(value, xPos + 5, yPosition - 8, 8)
            xPos += 125
          })
          yPosition -= 20
        }
      })
    }

    yPosition -= 20

    // Section 5 - Functional Test
    addText("Section 5 - Functional Test of Output Devices", 50, yPosition, 12, true, primaryColor)
    yPosition -= 15

    const functionalQuestions = [
      "A. Did all indicating circuits function normally?",
      "B. If tested, did air handlers shut down?",
      "C. If tested, did elevators recall?",
      "D. If tested, did suppression system solenoid energize?",
      "E. If tested, did panel send alarm signal to monitoring agency?",
      "F. If tested, did panel send trouble signal to monitoring agency?"
    ]

    functionalQuestions.forEach((question, index) => {
      const key = String.fromCharCode(97 + index) as keyof typeof data.functionalTest
      const answer = data.functionalTest?.[key] || "N/A"
      drawQuestionWithAnswer(question, answer, 55, yPosition)
      yPosition -= 15
    })

    yPosition -= 15

    // Check if we need a new page for Section 6 (needs about 200 points for all fields)
    checkPage(200)

    // Section 6 - System Power Supplies
    addText("Section 6 - System Power Supplies", 50, yPosition, 12, true, primaryColor)
    yPosition -= 15

    const powerFields = [
      ["Primary Power:", data.primaryPower],
      ["Nominal Voltage:", data.nominalVoltage],
      ["Nominal Voltage (Amps):", data.nominalVoltageAmps],
      ["Overcurrent Protection:", data.overcurrentProtection],
      ["Overcurrent Protection (Amps):", data.overcurrentProtectionAmps],
      ["Storage Battery (Amp Hour Rating):", data.storageBattery],
      ["Calculated to operate system for (Hours):", data.hoursSystemMustOperate],
      ["Emergency Generator Connected:", data.emergencyGeneratorConnected ? "Yes" : "No"]
    ]

    powerFields.forEach(([label, value]) => {
      addText(label, 55, yPosition, 9, true)
      addText(value || "", 280, yPosition, 9)
      yPosition -= 12
    })

    // Handle long fields with wrapping
    if (data.panelBreakerLocation) {
      addText("Panel, Breaker No. & Location:", 55, yPosition, 9, true)
      yPosition -= 10
      const panelLines = wrapText(data.panelBreakerLocation, 400, 9)
      panelLines.forEach(line => {
        addText(line, 75, yPosition, 9)
        yPosition -= 12
      })
    }

    if (data.batteryTestReading) {
      addText("Battery Test Reading:", 55, yPosition, 9, true)
      yPosition -= 10
      const batteryLines = wrapText(data.batteryTestReading, 400, 9)
      batteryLines.forEach(line => {
        addText(line, 75, yPosition, 9)
        yPosition -= 12
      })
    }

    if (data.fuelSourceLocation) {
      addText("Location of Fuel Source:", 55, yPosition, 9, true)
      yPosition -= 10
      const fuelLines = wrapText(data.fuelSourceLocation, 400, 9)
      fuelLines.forEach(line => {
        addText(line, 75, yPosition, 9)
        yPosition -= 12
      })
    }

    yPosition -= 15

    // Check if we need a new page for Section 7 (needs about 120 points for all questions)
    checkPage(120)

    // Section 7 - Post Test
    addText("Section 7 - Post Test", 50, yPosition, 12, true, primaryColor)
    yPosition -= 15

    const postTestQuestions = [
      "A. All initiating circuits returned to normal?",
      "B. All indicating circuits returned to normal?",
      "C. All shut-down circuits returned to normal?",
      "D. All valves seals replaced?",
      "E. Have all authorities been notified?"
    ]

    postTestQuestions.forEach((question, index) => {
      const key = String.fromCharCode(97 + index) as keyof typeof data.postTest
      const answer = data.postTest?.[key] || "N/A"
      drawQuestionWithAnswer(question, answer, 55, yPosition)
      yPosition -= 15
    })

    addText(`System Returned to Service At: ${data.returnToServiceAt || ""}`, 55, yPosition, 9, true)
    yPosition -= 20

    // Section 8 - Incorrectly Operating Equipment / Comments
    checkPage(150)
    addText("Section 8 - Incorrectly Operating Equipment / Comments", 50, yPosition, 12, true, primaryColor)
    yPosition -= 20
    addText("Comments", 55, yPosition, 10, true)
    yPosition -= 15
    const commentsText = data.incorrectlyOperatingEquipment || "None - all equipment functioning properly"
    const commentLines = wrapText(commentsText, 500, 9)
    commentLines.forEach(line => {
      addText(line, 55, yPosition, 9)
      yPosition -= 12
    })
    yPosition -= 15

    // Section 9 - Test Verification
    addText("Section 9 - Test Verification", 50, yPosition, 12, true, primaryColor)
    yPosition -= 20

    // Owner signature
    addText("Test Verification - Owner", 55, yPosition, 10, true)
    yPosition -= 15
    addText(`Name: ${data.testVerificationOwner?.name || ""}`, 55, yPosition, 9)
    addText(`Title: ${data.testVerificationOwner?.title || ""}`, 300, yPosition, 9)
    yPosition -= 12
    addText(`Date: ${data.testVerificationOwner?.date || ""}`, 55, yPosition, 9)
    yPosition -= 25

    // Add owner signature if available
    if (data.testVerificationOwner?.signature) {
      try {
        const base64 = data.testVerificationOwner.signature.split(',')[1]
        const imageBytes = typeof window === 'undefined'
          ? Uint8Array.from(Buffer.from(base64, 'base64'))
          : Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const signatureImage = await pdfDoc.embedPng(imageBytes)
        const imgDims = signatureImage.scale(0.3)
        page.drawImage(signatureImage, {
          x: 55,
          y: yPosition - 30,
          width: Math.min(imgDims.width, 200),
          height: Math.min(imgDims.height, 30)
        })
      } catch (err) {
        console.warn("Failed to embed owner signature:", err)
      }
    }

    page.drawLine({
      start: { x: 55, y: yPosition - 35 },
      end: { x: 300, y: yPosition - 35 },
      thickness: 0.5,
      color: darkGray
    })
    addText("Owner Signature", 55, yPosition - 45, 8)
    yPosition -= 60

    // CEC signature
    addText("Test Verification - CEC", 55, yPosition, 10, true)
    yPosition -= 15
    addText(`Name: ${data.testVerificationCEC?.name || ""}`, 55, yPosition, 9)
    addText(`Title: ${data.testVerificationCEC?.title || ""}`, 300, yPosition, 9)
    yPosition -= 12
    addText(`Date: ${data.testVerificationCEC?.date || ""}`, 55, yPosition, 9)
    yPosition -= 25

    // Add CEC signature if available
    if (data.testVerificationCEC?.signature) {
      try {
        const base64 = data.testVerificationCEC.signature.split(',')[1]
        const imageBytes = typeof window === 'undefined'
          ? Uint8Array.from(Buffer.from(base64, 'base64'))
          : Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const signatureImage = await pdfDoc.embedPng(imageBytes)
        const imgDims = signatureImage.scale(0.3)
        page.drawImage(signatureImage, {
          x: 55,
          y: yPosition - 30,
          width: Math.min(imgDims.width, 200),
          height: Math.min(imgDims.height, 30)
        })
      } catch (err) {
        console.warn("Failed to embed CEC signature:", err)
      }
    }

    page.drawLine({
      start: { x: 55, y: yPosition - 35 },
      end: { x: 300, y: yPosition - 35 },
      thickness: 0.5,
      color: darkGray
    })
    addText("CEC Signature", 55, yPosition - 45, 8)

    // Disclaimer footer – anchored near bottom with small separator
    const disclaimerText = "Custom Electric & Communications, LLC is not responsible for nor offers any opinion and/or guidance as to the condition or functionality of the wet and/or dry Sprinkler system components that may be installed at the property noted on this Report nor any Elevator life safety components. This Fire Alarm Inspection & Test Report only reflects the electrical continuity of the necessary signals required for the proper alarm sequencing and signaling and reports only on the devices noted on this Report. Custom Electric & Communications, LLC does not perform water flow testing associated with any wet and/or dry Sprinkler system components nor do we perform an Elevator shut down test procedure. Property Owners and/or Managers are required to be familiar with the NFPA requirements related to the proper inspection procedures related to Fire Alarm panel(s) and/or any associated wet/dry sprinkler system(s) and/or Elevator systems installed at the property referenced on this report. Local Authorities may also have separate reporting requirements."

    const footerBottomPadding = 10 // ≈10pt from paper edge
    const footerFontSize = 8
    const footerLineHeight = footerFontSize + 2
    let footerLines = wrapText(disclaimerText, 500, footerFontSize)
    let footerBlockHeight = footerLines.length * footerLineHeight

    // Calculate where the top of the disclaimer block would be if anchored at bottom
    let footerTopY = footerBottomPadding + footerBlockHeight
    const safeGapAbove = 12
    const signatureFloorY = yPosition - 45

    // If it would collide with the signatures on this page, move it up; if not possible, push to new page
    if (footerTopY + safeGapAbove > signatureFloorY) {
      // Try to move the block upward to maintain gap
      const maxTopY = signatureFloorY - safeGapAbove
      let newBottom = Math.max(footerBottomPadding, maxTopY - footerBlockHeight)
      // If still not enough space (e.g., extremely long footer), add a new page
      if (newBottom <= footerBottomPadding / 2) {
        page = pdfDoc.addPage([612, 792])
        // reset for new page
        footerTopY = footerBottomPadding + footerBlockHeight
      } else {
        footerTopY = newBottom + footerBlockHeight
      }
    }

    // Draw separator line just above the footer paragraph
    page.drawLine({
      start: { x: 50, y: footerTopY + 4 },
      end: { x: width - 50, y: footerTopY + 4 },
      thickness: 0.5,
      color: darkGray,
    })

    // Draw footer text from bottom upwards
    let drawY = footerBottomPadding
    footerLines.slice().reverse().forEach(line => {
      const w = font.widthOfTextAtSize(line, footerFontSize)
      const cx = (width - w) / 2
      addText(line, cx, drawY, footerFontSize)
      drawY += footerLineHeight
    })

    console.log("About to save PDF, final yPosition:", yPosition)
    console.log("Saving PDF...")
    const pdfBytes = await pdfDoc.save()
    console.log("PDF saved successfully, final size:", pdfBytes.length, "bytes")
    
    console.log("PDF generated successfully, size:", pdfBytes.length, "bytes")
    return pdfBytes

  } catch (error) {
    console.error("Error generating PDF:", error)
    console.error("Error details:", JSON.stringify(error))
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    throw new Error(`Failed to generate PDF: ${error}`)
    
  }
}
