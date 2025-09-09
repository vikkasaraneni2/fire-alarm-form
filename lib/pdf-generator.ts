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

    // Skipping logo embedding entirely per requirement. We'll render a text header instead.

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

    // Footer (disclaimer) – render on every page, and reserve space for it
    const disclaimerText = "Custom Electric & Communications, LLC is not responsible for nor offers any opinion and/or guidance as to the condition or functionality of the wet and/or dry Sprinkler system components that may be installed at the property noted on this Report nor any Elevator life safety components. This Fire Alarm Inspection & Test Report only reflects the electrical continuity of the necessary signals required for the proper alarm sequencing and signaling and reports only on the devices noted on this Report. Custom Electric & Communications, LLC does not perform water flow testing associated with any wet and/or dry Sprinkler system components nor do we perform an Elevator shut down test procedure. Property Owners and/or Managers are required to be familiar with the NFPA requirements related to the proper inspection procedures related to Fire Alarm panel(s) and/or any associated wet/dry sprinkler system(s) and/or Elevator systems installed at the property referenced on this report. Local Authorities may also have separate reporting requirements."
    const footerBottomPadding = 10
    const footerFontSize = 8
    const footerLineHeight = footerFontSize + 2
    const footerLines = wrapText(disclaimerText, 500, footerFontSize)
    const footerBlockHeight = footerLines.length * footerLineHeight
    const pageContentBottomMargin = footerBottomPadding + footerBlockHeight + 12

    const drawFooter = () => {
      // Separator line above footer
      page.drawLine({
        start: { x: 50, y: footerBottomPadding + footerBlockHeight + 4 },
        end: { x: width - 50, y: footerBottomPadding + footerBlockHeight + 4 },
        thickness: 0.5,
        color: darkGray,
      })
      // Footer text bottom-up
      let drawY = footerBottomPadding
      footerLines.slice().reverse().forEach(line => {
        const w = font.widthOfTextAtSize(line, footerFontSize)
        const cx = (width - w) / 2
        addText(line, cx, drawY, footerFontSize)
        drawY += footerLineHeight
      })
    }

    const checkPage = (spaceNeeded: number = 100) => {
      if (yPosition - spaceNeeded < pageContentBottomMargin) {
        drawFooter()
        page = pdfDoc.addPage([612, 792])
        yPosition = height - 50
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
    // Text-only header: company name (larger) above, report title slightly smaller below
    const company = sanitizeText("Custom Electric & Communications, LLC")
    const companySize = 18
    const companyWidth = boldFont.widthOfTextAtSize(company, companySize)
    page.drawText(company, {
      x: (width - companyWidth) / 2,
      y: height - 60,
      size: companySize,
      font: boldFont,
      color: primaryColor,
    })

    const title = sanitizeText("Fire Alarm Inspection & Test Report")
    const titleSize = 15
    const titleWidth = timesFont.widthOfTextAtSize(title, titleSize)
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: height - 80,
      size: titleSize,
      font: timesFont,
      color: primaryColor,
    })

    yPosition = height - 110

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

    // Collect photos for appendix while iterating equipment
    const photoAppendix: Array<{ equipmentLabel: string; location: string; note?: string; photo: any }> = []

    // Table rows
    if (data.equipmentTested) {
      data.equipmentTested.forEach((item: any) => {
        if (item.equipmentLabel) {
          // Wrap equipment label and compute dynamic row height
          const labelLines = wrapText(String(item.equipmentLabel), 115, 8)
          const rowHeight = Math.max(20, labelLines.length * 12)
          checkPage(rowHeight)

          // Draw cell borders using dynamic rowHeight
          xPos = 50
          for (let c = 0; c < 4; c++) {
            page.drawRectangle({
              x: xPos - 2,
              y: yPosition - (rowHeight - 5),
              width: 125,
              height: rowHeight,
              borderColor: darkGray,
              borderWidth: 0.5
            })
            xPos += 125
          }

          // Draw cell contents
          // Column 1: equipment label wrapped starting near top of the cell
          const cellBottomY = yPosition - (rowHeight - 5)
          const cellTopY = cellBottomY + rowHeight
          let textY = cellTopY - 8
          labelLines.forEach((ln) => {
            addText(ln, 50 + 5, textY, 8)
            textY -= 12
          })
          // Other columns single-line
          addText(item.totalNumber?.toString() || "0", 50 + 125 + 5, cellTopY - 8, 8)
          addText(item.totalNumberTested?.toString() || "0", 50 + 250 + 5, cellTopY - 8, 8)
          const functionSummary = `Y: ${item.functionYesCount || 0} | N: ${item.functionNoCount || 0} | N/A: ${item.functionNaCount || 0}`
          addText(functionSummary, 50 + 375 + 5, cellTopY - 8, 8)

          yPosition -= rowHeight

          // Print failed details under the row (if any), and queue photos for appendix
          const failedDetails = item.failedDetails || []
          if ((item.functionNoCount || 0) > 0 && failedDetails.length > 0) {
            checkPage(50)
            yPosition -= 8
            addText("Failed device details:", 55, yPosition - 2, 8, true)
            yPosition -= 12
            failedDetails.forEach((detail: any, idx: number) => {
              const line = `${idx + 1}. Location: ${detail.location || ""}; ${detail.brand ? `Brand: ${detail.brand}; ` : ""}${detail.model ? `Model: ${detail.model}; ` : ""}${detail.note ? `Note: ${detail.note}` : ""}${detail.photos?.length ? `; Photos: ${detail.photos.length}` : ""}`
              const wrap = wrapText(line, 500, 8)
              wrap.forEach((ln) => {
                checkPage(15)
                addText(ln, 65, yPosition, 8)
                yPosition -= 12
              })
              yPosition -= 4
              const photos = Array.isArray(detail.photos) ? detail.photos : []
              photos.forEach((p: any) => {
                photoAppendix.push({ equipmentLabel: item.equipmentLabel, location: detail.location, note: detail.note, photo: p })
              })
            })
            yPosition -= 12
          }
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

    const powerFields: Array<[string, string]> = [
      ["Primary Power:", data.primaryPower || ""],
      ["Nominal Voltage:", data.nominalVoltage || ""],
      ["Nominal Voltage (Amps):", data.nominalVoltageAmps || ""],
      ["Overcurrent Protection:", data.overcurrentProtection || ""],
      ["Overcurrent Protection (Amps):", data.overcurrentProtectionAmps || ""],
      ["Storage Battery (Amp Hour Rating):", data.storageBattery || ""],
      ["Calculated to operate system for (Hours):", data.hoursSystemMustOperate || ""],
      ["Emergency Generator Connected:", data.emergencyGeneratorConnected ? "Yes" : "No"]
    ]

    powerFields.forEach(([label, value]) => {
      checkPage(16)
      addText(label, 55, yPosition, 9, true)
      addText(value, 280, yPosition, 9)
      yPosition -= 14
    })

    // Handle long fields with wrapping
    if (data.panelBreakerLocation) {
      addText("Panel, Breaker No. & Location:", 55, yPosition, 9, true)
      yPosition -= 10
      const panelLines = wrapText(data.panelBreakerLocation, 400, 9)
      panelLines.forEach(line => {
        checkPage(15)
        addText(line, 75, yPosition, 9)
        yPosition -= 12
      })
      yPosition -= 6
    }

    if (data.batteryTestReading) {
      addText("Battery Test Reading:", 55, yPosition, 9, true)
      yPosition -= 10
      const batteryLines = wrapText(data.batteryTestReading, 400, 9)
      batteryLines.forEach(line => {
        checkPage(15)
        addText(line, 75, yPosition, 9)
        yPosition -= 12
      })
      yPosition -= 6
    }

    if (data.fuelSourceLocation) {
      addText("Location of Fuel Source:", 55, yPosition, 9, true)
      yPosition -= 10
      const fuelLines = wrapText(data.fuelSourceLocation, 400, 9)
      fuelLines.forEach(line => {
        checkPage(15)
        addText(line, 75, yPosition, 9)
        yPosition -= 12
      })
      yPosition -= 6
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

    // Photos appendix (Section 10) - one photo per page, full scale-to-fit, never cropped
    if (photoAppendix.length > 0) {
      page = pdfDoc.addPage([612, 792])
      yPosition = height - 50
      addText("Section 10 - Photo Evidence", 50, yPosition, 12, true, primaryColor)
      yPosition -= 20

      for (let i = 0; i < photoAppendix.length; i++) {
        const { equipmentLabel, location, note, photo } = photoAppendix[i]
        if (i > 0) {
          // draw footer for previous page
          drawFooter()
          page = pdfDoc.addPage([612, 792])
        }
        yPosition = height - 70
        addText(`Device: ${equipmentLabel}`, 55, yPosition, 10, true)
        yPosition -= 14
        addText(`Location: ${location}`, 55, yPosition, 9)
        yPosition -= 12
        if (note) {
          const lines = wrapText(`Note: ${note}`, 500, 9)
          lines.forEach((ln) => { addText(ln, 55, yPosition, 9); yPosition -= 12 })
        }
        yPosition -= 6

        try {
          const base64 = (photo.dataUrl || '').split(',')[1]
          if (base64) {
            const imageBytes = typeof window === 'undefined' ? Uint8Array.from(Buffer.from(base64, 'base64')) : Uint8Array.from(atob(base64), c => c.charCodeAt(0))
            const img = photo.mimeType === 'image/png' ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes)
            const maxW = width - 100
            const dims = img.scale(1)
            const availableH = height - (70 + (note ? wrapText(`Note: ${note}`, 500, 9).length * 12 + 20 : 20)) - (footerBottomPadding + footerBlockHeight + 12)
            const ratio = Math.min(maxW / dims.width, Math.max(availableH, 10) / dims.height, 1)
            const drawW = dims.width * ratio
            const drawH = dims.height * ratio
            const x = (width - drawW) / 2
            const y = (footerBottomPadding + footerBlockHeight + 12) + ((availableH - drawH) / 2)
            page.drawImage(img, { x, y, width: drawW, height: drawH })
          } else {
            addText('(Invalid image)', 55, yPosition, 9)
          }
        } catch (e) {
          addText('(Failed to render image)', 55, yPosition, 9)
        }
      }
    }

    // Draw footer on the final page as well
    drawFooter()

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
