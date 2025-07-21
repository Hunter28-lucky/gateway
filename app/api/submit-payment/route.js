export const dynamic = "force-dynamic";
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { utr_number, email_phone, screenshot_url, site_id } = body

    // Validate required fields
    if (!utr_number || !utr_number.trim()) {
      return Response.json(
        { error: 'UTR number is required' },
        { status: 400 }
      )
    }
    if (!site_id) {
      return Response.json(
        { error: 'site_id is required' },
        { status: 400 }
      )
    }

    // Optionally, check if site_id exists in websites table
    const { data: site, error: siteError } = await supabaseAdmin
      .from('websites')
      .select('id')
      .eq('id', site_id)
      .single()
    if (siteError || !site) {
      return Response.json(
        { error: 'Invalid site_id' },
        { status: 400 }
      )
    }

    // Validate UTR number format (basic validation)
    const utrNumber = utr_number.trim()
    if (utrNumber.length < 8 || utrNumber.length > 20) {
      return Response.json(
        { error: 'UTR number must be between 8 and 20 characters' },
        { status: 400 }
      )
    }

    // Validate email/phone format if provided
    if (email_phone && email_phone.trim()) {
      const value = email_phone.trim()
      const isEmail = value.includes('@')
      const isPhone = /^\+?\d{10,15}$/.test(value)
      if (!isEmail && !isPhone) {
        return Response.json(
          { error: 'Enter a valid email or phone number' },
          { status: 400 }
        )
      }
    }

    // Insert payment
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        utr_number: utrNumber,
        email_phone: email_phone || null,
        screenshot_url: screenshot_url || null,
        site_id,
      })

    if (insertError) {
      return Response.json(
        { error: 'Database error: ' + insertError.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}