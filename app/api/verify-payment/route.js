export const dynamic = "force-dynamic";
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { payment_id, status } = body

    // Validate input
    if (!payment_id || !status) {
      return Response.json(
        { error: 'Payment ID and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return Response.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update payment status
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({ status })
      .eq('id', payment_id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    if (data.length === 0) {
      return Response.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return Response.json({ 
      success: true, 
      payment: data[0] 
    })
  } catch (error) {
    console.error('API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}