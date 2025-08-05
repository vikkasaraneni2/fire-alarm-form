import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { FireAlarmFormData } from "./validation"

export async function generateFireAlarmPDF(data: FireAlarmFormData): Promise<Uint8Array> {
  try {
    console.log("Creating PDF document...")
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()

    console.log("Embedding fonts...")
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const primaryColor = rgb(0.078, 0.298, 0.518) // #144C84
    const yellowColor = rgb(0.91, 0.784, 0.047) // #E8C80C
    const lightGray = rgb(0.95, 0.95, 0.95)
    const darkGray = rgb(0.3, 0.3, 0.3)

    let yPosition = height - 40
    const leftMargin = 40
    const rightMargin = width - 40
    const lineHeight = 16
    const sectionSpacing = 25
    const subsectionSpacing = 15

    // Helper function to add text
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      try {
        const fontSize = options.size || 10
        const safeText = String(text || "")

        if (safeText.length === 0) return y

        const textWidth = font.widthOfTextAtSize(safeText, fontSize)
        const maxWidth = options.maxWidth || rightMargin - x

        if (textWidth > maxWidth) {
          // Handle text wrapping
          const words = safeText.split(" ")
          let currentLine = ""
          let currentY = y

          for (const word of words) {
            const testLine = currentLine + (currentLine ? " " : "") + word
            const testWidth = font.widthOfTextAtSize(testLine, fontSize)

            if (testWidth > maxWidth && currentLine) {
              page.drawText(currentLine, {
                x,
                y: currentY,
                size: fontSize,
                font: options.bold ? boldFont : font,
                color: options.color || rgb(0, 0, 0),
              })
              currentLine = word
              currentY -= lineHeight
            } else {
              currentLine = testLine
            }
          }

          if (currentLine) {
            page.drawText(currentLine, {
              x,
              y: currentY,
              size: fontSize,
              font: options.bold ? boldFont : font,
              color: options.color || rgb(0, 0, 0),
            })
          }

          return currentY
        } else {
          page.drawText(safeText, {
            x,
            y,
            size: fontSize,
            font: options.bold ? boldFont : font,
            color: options.color || rgb(0, 0, 0),
          })
          return y
        }
      } catch (error) {
        console.error("Error adding text:", error)
        return y
      }
    }

    // Helper function to draw a box
    const drawBox = (x: number, y: number, width: number, height: number, fillColor?: any) => {
      try {
        if (fillColor) {
          page.drawRectangle({
            x,
            y: y - height,
            width,
            height,
            color: fillColor,
          })
        }
        page.drawRectangle({
          x,
          y: y - height,
          width,
          height,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        })
      } catch (error) {
        console.error("Error drawing box:", error)
      }
    }

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace = 100) => {
      if (yPosition < requiredSpace) {
        page = pdfDoc.addPage([612, 792])
        yPosition = height - 40
        return true
      }
      return false
    }

    // Header with logo space and title
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 80, lightGray)
    addText("FIRE ALARM INSPECTION & TEST REPORT", leftMargin + 20, yPosition - 25, {
      size: 18,
      bold: true,
      color: primaryColor,
    })
    addText("Custom Electric & Communications, LLC", leftMargin + 20, yPosition - 45, {
      size: 12,
      bold: true,
      color: primaryColor,
    })
    addText(`Report Date: ${new Date().toLocaleDateString()}`, rightMargin - 150, yPosition - 65, {
      size: 10,
      color: darkGray,
    })
    yPosition -= 100

    // Section 1 - Property Information
    checkNewPage(150)
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 1 — PROPERTY INFORMATION", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    const propertyInfo = [
      [`Property Name:`, data.propertyName || ""],
      [`Street Address:`, data.street || ""],
      [`City, State, Zip:`, data.cityStateZip || ""],
      [`Primary Contact:`, data.contact || ""],
      [`Phone Number:`, data.phone || ""],
      [`Inspection Frequency:`, data.frequencyOfInspection || ""],
      [`Inspection Date:`, data.date || ""],
    ]

    propertyInfo.forEach(([label, value]) => {
      addText(label, leftMargin + 10, yPosition, { size: 10, bold: true })
      addText(value, leftMargin + 150, yPosition, { size: 10 })
      yPosition -= lineHeight
    })
    yPosition -= sectionSpacing

    // Section 2 - Notify Prior to Testing
    checkNewPage(120)
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 2 — NOTIFY PRIOR TO TESTING", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    // Table header
    const tableY = yPosition
    const colWidths = [120, 180, 120]
    let currentX = leftMargin + 10

    drawBox(currentX, tableY, colWidths[0], 20, lightGray)
    addText("Entity", currentX + 5, tableY - 12, { size: 10, bold: true })
    currentX += colWidths[0]

    drawBox(currentX, tableY, colWidths[1], 20, lightGray)
    addText("Name", currentX + 5, tableY - 12, { size: 10, bold: true })
    currentX += colWidths[1]

    drawBox(currentX, tableY, colWidths[2], 20, lightGray)
    addText("Phone", currentX + 5, tableY - 12, { size: 10, bold: true })

    yPosition -= 25

    if (data.notifyEntities && Array.isArray(data.notifyEntities)) {
      data.notifyEntities.forEach((entity) => {
        if (entity && (entity.name || entity.phone)) {
          currentX = leftMargin + 10

          drawBox(currentX, yPosition, colWidths[0], 18)
          addText(entity.entity || "", currentX + 5, yPosition - 12, { size: 9 })
          currentX += colWidths[0]

          drawBox(currentX, yPosition, colWidths[1], 18)
          addText(entity.name || "", currentX + 5, yPosition - 12, { size: 9 })
          currentX += colWidths[1]

          drawBox(currentX, yPosition, colWidths[2], 18)
          addText(entity.phone || "", currentX + 5, yPosition - 12, { size: 9 })

          yPosition -= 20
        }
      })
    }
    yPosition -= sectionSpacing

    // Section 3 - Control Panel Status
    checkNewPage(200)
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 3 — CONTROL PANEL STATUS", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    const controlPanelLabels = [
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

    // Two column layout for control panel
    const leftCol = controlPanelLabels.slice(0, 5)
    const rightCol = controlPanelLabels.slice(5)
    const colWidth = (rightMargin - leftMargin - 20) / 2

    leftCol.forEach((label, index) => {
      const key = String.fromCharCode(97 + index) as keyof typeof data.controlPanelStatus
      const value = data.controlPanelStatus?.[key] || "N/A"
      addText(`${label}:`, leftMargin + 10, yPosition, { size: 10 })
      addText(value, leftMargin + 10 + 200, yPosition, {
        size: 10,
        bold: true,
        color: value === "Yes" ? rgb(0, 0.6, 0) : value === "No" ? rgb(0.8, 0, 0) : darkGray,
      })
      yPosition -= lineHeight
    })

    let rightYPosition = yPosition + leftCol.length * lineHeight
    rightCol.forEach((label, index) => {
      const key = String.fromCharCode(97 + index + 5) as keyof typeof data.controlPanelStatus
      const value = data.controlPanelStatus?.[key] || "N/A"
      addText(`${label}:`, leftMargin + 10 + colWidth, rightYPosition, { size: 10 })
      addText(value, leftMargin + 10 + colWidth + 200, rightYPosition, {
        size: 10,
        bold: true,
        color: value === "Yes" ? rgb(0, 0.6, 0) : value === "No" ? rgb(0.8, 0, 0) : darkGray,
      })
      rightYPosition -= lineHeight
    })

    yPosition -= subsectionSpacing
    addText(`System Put in Test At: ${data.putSystemInTestAt || ""}`, leftMargin + 10, yPosition, {
      size: 10,
      bold: true,
    })
    yPosition -= lineHeight

    if (data.comments) {
      yPosition -= subsectionSpacing
      addText("Comments:", leftMargin + 10, yPosition, { size: 10, bold: true })
      yPosition -= lineHeight
      yPosition =
        addText(data.comments, leftMargin + 10, yPosition, {
          size: 10,
          maxWidth: rightMargin - leftMargin - 20,
        }) - lineHeight
    }
    yPosition -= sectionSpacing

    // Check if we need a new page for equipment section
    checkNewPage(300)

    // Section 4 - Equipment Tested
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 4 — EQUIPMENT TESTED", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    // Equipment table header
    const equipColWidths = [200, 60, 60, 80]
    currentX = leftMargin + 10

    drawBox(currentX, yPosition, equipColWidths[0], 20, lightGray)
    addText("Equipment", currentX + 5, yPosition - 12, { size: 10, bold: true })
    currentX += equipColWidths[0]

    drawBox(currentX, yPosition, equipColWidths[1], 20, lightGray)
    addText("# Tested", currentX + 5, yPosition - 12, { size: 9, bold: true })
    currentX += equipColWidths[1]

    drawBox(currentX, yPosition, equipColWidths[2], 20, lightGray)
    addText("Tested", currentX + 5, yPosition - 12, { size: 9, bold: true })
    currentX += equipColWidths[2]

    drawBox(currentX, yPosition, equipColWidths[3], 20, lightGray)
    addText("Function OK", currentX + 5, yPosition - 12, { size: 9, bold: true })

    yPosition -= 25

    if (data.equipmentTested && Array.isArray(data.equipmentTested)) {
      data.equipmentTested.forEach((equipment) => {
        if (equipment && equipment.equipmentLabel) {
          checkNewPage(25)
          currentX = leftMargin + 10

          drawBox(currentX, yPosition, equipColWidths[0], 18)
          addText(equipment.equipmentLabel, currentX + 5, yPosition - 12, { size: 8, maxWidth: equipColWidths[0] - 10 })
          currentX += equipColWidths[0]

          drawBox(currentX, yPosition, equipColWidths[1], 18)
          addText((equipment.totalNumberTested || 0).toString(), currentX + 5, yPosition - 12, { size: 9 })
          currentX += equipColWidths[1]

          drawBox(currentX, yPosition, equipColWidths[2], 18)
          addText(equipment.tested ? "Yes" : "No", currentX + 5, yPosition - 12, { size: 9 })
          currentX += equipColWidths[2]

          drawBox(currentX, yPosition, equipColWidths[3], 18)
          addText(equipment.functionOK || "N/A", currentX + 5, yPosition - 12, { size: 9 })

          yPosition -= 20
        }
      })
    }
    yPosition -= sectionSpacing

    // Continue with remaining sections...
    checkNewPage(150)

    // Section 5 - Functional Test
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 5 — FUNCTIONAL TEST OF OUTPUT DEVICES", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    const functionalTestLabels = [
      "A. Audible notification appliances",
      "B. Visible notification appliances",
      "C. Speaker notification appliances",
      "D. Fire safety functions",
      "E. Suppression systems",
      "F. Smoke control systems",
    ]

    functionalTestLabels.forEach((label, index) => {
      const key = String.fromCharCode(97 + index) as keyof typeof data.functionalTest
      const value = data.functionalTest?.[key] || "N/A"
      addText(`${label}:`, leftMargin + 10, yPosition, { size: 10 })
      addText(value, leftMargin + 300, yPosition, {
        size: 10,
        bold: true,
        color: value === "Yes" ? rgb(0, 0.6, 0) : value === "No" ? rgb(0.8, 0, 0) : darkGray,
      })
      yPosition -= lineHeight
    })
    yPosition -= sectionSpacing

    // Section 6 - System Power Supplies
    checkNewPage(200)
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 6 — SYSTEM POWER SUPPLIES", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    const powerSupplyInfo = [
      [`Primary Power:`, `${data.primaryPower || 0} Amps`],
      [`Nominal Voltage:`, `${data.nominalVoltage || 0} Volts`],
      [`Overcurrent Protection:`, data.overcurrentProtection || ""],
      [`Panel Breaker Location:`, data.panelBreakerLocation || ""],
      [`Battery Test Reading:`, `${data.batteryTestReadingVolts || 0}V, ${data.batteryTestReadingAmps || 0}A`],
      [`Storage Battery:`, `${data.storageBatteryAmpHour || 0} Amp Hours`],
      [`Hours System Must Operate:`, `${data.hoursSystemMustOperate || 0} hours`],
      [`Emergency Generator:`, data.emergencyGeneratorConnected ? "Connected" : "Not Connected"],
    ]

    if (data.fuelSourceLocation) {
      powerSupplyInfo.push([`Fuel Source Location:`, data.fuelSourceLocation])
    }

    powerSupplyInfo.forEach(([label, value]) => {
      addText(label, leftMargin + 10, yPosition, { size: 10, bold: true })
      addText(value, leftMargin + 200, yPosition, { size: 10 })
      yPosition -= lineHeight
    })
    yPosition -= sectionSpacing

    // Section 7 - Post Test
    checkNewPage(150)
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 7 — POST TEST", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    const postTestLabels = [
      "A. All initiating circuits returned to normal?",
      "B. All indicating circuits returned to normal?",
      "C. All shut-down circuits returned to normal?",
      "D. All valves seals replaced?",
      "E. Have all authorities been notified?",
    ]

    postTestLabels.forEach((label, index) => {
      const key = String.fromCharCode(97 + index) as keyof typeof data.postTest
      const value = data.postTest?.[key] || "N/A"
      addText(`${label}`, leftMargin + 10, yPosition, { size: 10 })
      addText(value, leftMargin + 350, yPosition, {
        size: 10,
        bold: true,
        color: value === "Yes" ? rgb(0, 0.6, 0) : value === "No" ? rgb(0.8, 0, 0) : darkGray,
      })
      yPosition -= lineHeight
    })

    yPosition -= subsectionSpacing
    addText(`System Returned to Service At: ${data.returnToServiceAt || ""}`, leftMargin + 10, yPosition, {
      size: 10,
      bold: true,
    })
    yPosition -= sectionSpacing

    // Section 8 - Comments
    if (data.incorrectlyOperatingEquipment) {
      checkNewPage(100)
      drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
      addText("SECTION 8 — INCORRECTLY OPERATING EQUIPMENT / COMMENTS", leftMargin + 10, yPosition - 15, {
        size: 12,
        bold: true,
        color: rgb(1, 1, 1),
      })
      yPosition -= 35

      yPosition =
        addText(data.incorrectlyOperatingEquipment, leftMargin + 10, yPosition, {
          size: 10,
          maxWidth: rightMargin - leftMargin - 20,
        }) - sectionSpacing
    }

    // Section 9 - Sign-off
    checkNewPage(200)
    drawBox(leftMargin, yPosition, rightMargin - leftMargin, 25, primaryColor)
    addText("SECTION 9 — SIGN-OFF BLOCKS", leftMargin + 10, yPosition - 15, {
      size: 12,
      bold: true,
      color: rgb(1, 1, 1),
    })
    yPosition -= 35

    // Two column layout for signatures
    const signatureColWidth = (rightMargin - leftMargin - 30) / 2

    // Owner Verification
    drawBox(leftMargin + 10, yPosition, signatureColWidth, 80, lightGray)
    addText("Test Verification - Owner", leftMargin + 15, yPosition - 15, { size: 11, bold: true })
    addText(`Name: ${data.testVerificationOwner?.name || ""}`, leftMargin + 15, yPosition - 35, { size: 10 })
    addText(`Title: ${data.testVerificationOwner?.title || ""}`, leftMargin + 15, yPosition - 50, { size: 10 })
    addText(`Date: ${data.testVerificationOwner?.date || ""}`, leftMargin + 15, yPosition - 65, { size: 10 })

    // CEC Verification
    drawBox(leftMargin + 20 + signatureColWidth, yPosition, signatureColWidth, 80, lightGray)
    addText("Test Verification - CEC", leftMargin + 25 + signatureColWidth, yPosition - 15, { size: 11, bold: true })
    addText(`Name: ${data.testVerificationCEC?.name || ""}`, leftMargin + 25 + signatureColWidth, yPosition - 35, {
      size: 10,
    })
    addText(`Title: ${data.testVerificationCEC?.title || ""}`, leftMargin + 25 + signatureColWidth, yPosition - 50, {
      size: 10,
    })
    addText(`Date: ${data.testVerificationCEC?.date || ""}`, leftMargin + 25 + signatureColWidth, yPosition - 65, {
      size: 10,
    })

    yPosition -= 100

    // Footer
    addText("Generated by Custom Electric & Communications, LLC", leftMargin, 30, {
      size: 9,
      color: darkGray,
    })
    addText(`Generated on ${new Date().toLocaleString()}`, rightMargin - 150, 30, {
      size: 9,
      color: darkGray,
    })

    console.log("Saving PDF...")
    const pdfBytes = await pdfDoc.save()
    console.log("PDF saved successfully, final size:", pdfBytes.length, "bytes")

    return pdfBytes
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
