import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/server'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === 'checkout.session.completed') {
        const { createAdminClient } = await import("@/utils/supabase/admin")
        const supabase = createAdminClient()
        const { userId, targetMonth } = session.metadata!

        // Insert payment record
        const { error } = await supabase.from('payments').insert({
            user_id: userId,
            amount: session.amount_total,
            currency: session.currency,
            status: 'succeeded',
            target_month: targetMonth,
            stripe_session_id: session.id,
        })

        if (error) {
            console.error('Error inserting payment:', error)
            return new NextResponse('Database Error', { status: 500 })
        }
    }

    return new NextResponse(null, { status: 200 })
}
