"use client"

import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "Form submitted successfully!"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Success!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">
            Your fire alarm inspection report has been submitted and will be processed shortly.
          </p>
          <Button asChild className="w-full">
            <Link href="/fire-alarm-form">Submit Another Report</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
