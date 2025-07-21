"use client"

import PaymentWidget from '@/components/PaymentWidget'

export default function PaymentPage() {
  // Replace 'YOUR_SITE_ID' with a real siteId from your admin panel for testing
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <PaymentWidget siteId="YOUR_SITE_ID" />
    </div>
  )
}