"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void
  className?: string
}

export interface SignatureCanvasRef {
  clear: () => void
  getSignature: () => string
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSignatureChange, className = "" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            onSignatureChange("")
          }
        }
      },
      getSignature: () => {
        const canvas = canvasRef.current
        return canvas ? canvas.toDataURL() : ""
      },
    }))

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size to match display size
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      const getEventPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect()
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
        return {
          x: clientX - rect.left,
          y: clientY - rect.top,
        }
      }

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        isDrawing.current = true
        const pos = getEventPos(e)
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
      }

      const draw = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        if (!isDrawing.current) return
        const pos = getEventPos(e)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        onSignatureChange(canvas.toDataURL())
      }

      const stopDrawing = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        isDrawing.current = false
      }

      // Mouse events
      canvas.addEventListener("mousedown", startDrawing)
      canvas.addEventListener("mousemove", draw)
      canvas.addEventListener("mouseup", stopDrawing)
      canvas.addEventListener("mouseout", stopDrawing)

      // Touch events for mobile
      canvas.addEventListener("touchstart", startDrawing, { passive: false })
      canvas.addEventListener("touchmove", draw, { passive: false })
      canvas.addEventListener("touchend", stopDrawing, { passive: false })
      canvas.addEventListener("touchcancel", stopDrawing, { passive: false })

      return () => {
        canvas.removeEventListener("mousedown", startDrawing)
        canvas.removeEventListener("mousemove", draw)
        canvas.removeEventListener("mouseup", stopDrawing)
        canvas.removeEventListener("mouseout", stopDrawing)
        canvas.removeEventListener("touchstart", startDrawing)
        canvas.removeEventListener("touchmove", draw)
        canvas.removeEventListener("touchend", stopDrawing)
        canvas.removeEventListener("touchcancel", stopDrawing)
      }
    }, [onSignatureChange])

    return (
      <div className={`border rounded-md bg-white ${className}`}>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full h-32 cursor-crosshair touch-none"
          style={{ touchAction: "none" }}
        />
      </div>
    )
  },
)

SignatureCanvas.displayName = "SignatureCanvas"
