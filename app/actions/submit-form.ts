"use server"

import { fireAlarmSchema, type FireAlarmFormData } from "@/lib/validation"
import { generateFireAlarmPDF } from "@/lib/pdf-generator"

export async function handleSubmitServer(data: FireAlarmFormData) {
  try {
    // Validate with Zod server-side
    const validatedData = fireAlarmSchema.parse(data)

    // Generate PDF
    const pdfBytes = await generateFireAlarmPDF(validatedData)

    // Store PDF via @vercel/blob put().
    // TODO: 2) Store PDF via @vercel/blob put().

    // Send email via Resend.
    // TODO: 3) Send email via Resend.

    console.log("Form submitted successfully:", validatedData)
    console.log("PDF generated, size:", pdfBytes.length, "bytes")

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: "Form submitted successfully!",
      pdfBytes: Array.from(pdfBytes), // Convert Uint8Array to regular array for JSON serialization
    }
  } catch (error) {
    console.error("Form submission error:", error)
    return { success: false, message: "Failed to submit form. Please try again." }
  }
}
