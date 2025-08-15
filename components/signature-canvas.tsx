"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react"

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void
  className?: string
  value?: string
}

export interface SignatureCanvasRef {
  clear: () => void
  getSignature: () => string
  loadSignature: (signature: string) => void
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSignatureChange, className = "", value }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)

    const loadSignature = (signature: string) => {
      const canvas = canvasRef.current
      if (canvas && signature) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          const img = new Image()
          img.onload = () => {
            ctx.save()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio)
            ctx.restore()
          }
          img.onerror = () => {
            console.warn("Failed to load signature image")
          }
          img.src = signature
        }
      }
    }

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
      loadSignature,
    }))

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      const getPos = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top }
      }

      const onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
        canvas.setPointerCapture(e.pointerId)
        isDrawing.current = true
        const pos = getPos(e)
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!isDrawing.current) return
        e.preventDefault()
        const pos = getPos(e)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        // Do NOT save on every move to avoid redraw jitter
      }

      const stop = (e: PointerEvent) => {
        if (!isDrawing.current) return
        e.preventDefault()
        isDrawing.current = false
        try { canvas.releasePointerCapture(e.pointerId) } catch {}
        // Save final image once per stroke
        onSignatureChange(canvas.toDataURL())
      }

      canvas.addEventListener("pointerdown", onPointerDown)
      canvas.addEventListener("pointermove", onPointerMove)
      canvas.addEventListener("pointerup", stop)
      canvas.addEventListener("pointercancel", stop)
      canvas.addEventListener("pointerleave", stop)

      if (value) {
        setTimeout(() => loadSignature(value), 0)
      }

      return () => {
        canvas.removeEventListener("pointerdown", onPointerDown)
        canvas.removeEventListener("pointermove", onPointerMove)
        canvas.removeEventListener("pointerup", stop)
        canvas.removeEventListener("pointercancel", stop)
        canvas.removeEventListener("pointerleave", stop)
      }
    }, [onSignatureChange])

    // Only redraw from value when not actively drawing
    useEffect(() => {
      if (!isDrawing.current && value) loadSignature(value)
    }, [value])

    return (
      <div className={`border rounded-md bg-white ${className}`}>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full h-32 cursor-crosshair"
          style={{ touchAction: "none", pointerEvents: "auto" }}
        />
      </div>
    )
  },
)

SignatureCanvas.displayName = "SignatureCanvas"
