export interface ShareOptions {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export async function shareNatively(options: ShareOptions): Promise<boolean> {
  // Check if Web Share API is supported (iOS Safari supports this)
  if (navigator.share && navigator.canShare) {
    try {
      // Check if the content can be shared
      if (navigator.canShare(options)) {
        await navigator.share(options)
        return true
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Fall back to download if sharing fails
      return false
    }
  }

  // Fallback for browsers that don't support Web Share API
  return false
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function createPDFFile(pdfBytes: Uint8Array, filename: string): File {
  const blob = new Blob([pdfBytes], { type: "application/pdf" })
  return new File([blob], filename, { type: "application/pdf" })
}
