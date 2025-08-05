"use server"

import { fireAlarmSchema, type FireAlarmFormData } from "@/lib/validation"
import { generateFireAlarmPDF } from "@/lib/pdf-generator"

export async function handleSubmitServer(data: FireAlarmFormData) {
  try {
    console.log("Starting form submission...")

    // Validate with Zod server-side
    console.log("Validating form data...")
    const validatedData = fireAlarmSchema.parse(data)
    console.log("Form data validated successfully")

    // Generate PDF
    console.log("Starting PDF generation...")
    const pdfBytes = await generateFireAlarmPDF(validatedData)
    console.log("PDF generated successfully, size:", pdfBytes.length, "bytes")

    // Store PDF via @vercel/blob put().
    // TODO: 2) Store PDF via @vercel/blob put().

    // Send email via Resend.
    // TODO: 3) Send email via Resend.

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      message: "PDF generated successfully!",
      pdfBytes: Array.from(pdfBytes), // Convert Uint8Array to regular array for JSON serialization
    }
  } catch (error) {
    console.error("Form submission error:", error)

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // Return more specific error messages
    let errorMessage = "Failed to generate PDF. Please try again."

    if (error instanceof Error) {
      if (error.message.includes("validation")) {
        errorMessage = "Form validation failed. Please check your inputs."
      } else if (error.message.includes("PDF")) {
        errorMessage = "PDF generation failed. Please try again."
      } else {
        errorMessage = `Error: ${error.message}`
      }
    }

    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
