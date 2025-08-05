export interface ShareOptions {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export async function shareNatively(options: ShareOptions): Promise<boolean> {
  console.log("shareNatively called with:", options)

  // Check if Web Share API is supported (iOS Safari supports this)
  if (navigator.share) {
    console.log("Web Share API is supported")

    try {
      // Check if the content can be shared
      if (navigator.canShare && !navigator.canShare(options)) {
        console.log("Content cannot be shared via Web Share API")
        return false
      }

      console.log("Attempting to share...")
      await navigator.share(options)
      console.log("Share successful")
      return true
    } catch (error) {
      console.error("Error sharing:", error)
      // Fall back to download if sharing fails
      return false
    }
  } else {
    console.log("Web Share API not supported")
    return false
  }
}

export function downloadFile(blob: Blob, filename: string) {
  console.log("downloadFile called with filename:", filename)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  console.log("Download initiated")
}

export function createPDFFile(pdfBytes: Uint8Array, filename: string): File {
  console.log("createPDFFile called with filename:", filename, "size:", pdfBytes.length)
  const blob = new Blob([pdfBytes], { type: "application/pdf" })
  const file = new File([blob], filename, { type: "application/pdf" })
  console.log("PDF file created:", file)
  return file
}
