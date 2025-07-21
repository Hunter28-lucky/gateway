export const dynamic = "force-dynamic";
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request) {
  try {
    const body = await request.json()
    const { payment_id } = body

    // Validate input
    if (!payment_id) {
      return Response.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment details first to delete screenshot if exists
    const { data: paymentData, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('screenshot_url')
      .eq('id', payment_id)
      .single()

    if (fetchError) {
      console.error('Error fetching payment:', fetchError)
      return Response.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Delete screenshot from storage if exists
    if (paymentData.screenshot_url) {
      try {
        const fileName = paymentData.screenshot_url.split('/').pop()
        if (fileName) {
          await supabaseAdmin.storage
            .from('screenshots')
            .remove([fileName])
        }
      } catch (storageError) {
        console.error('Error deleting screenshot:', storageError)
        // Continue with payment deletion even if screenshot deletion fails
      }
    }

    // Delete payment record
    const { error: deleteError } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('id', payment_id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return Response.json(
        { error: 'Failed to delete payment' },
        { status: 500 }
      )
    }

    return Response.json({ 
      success: true, 
      message: 'Payment deleted successfully' 
    })
  } catch (error) {
    console.error('API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 