'use server'

import { stripe } from '@/utils/stripe/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(formData: FormData) {
    const targetMonth = formData.get('targetMonth') as string
    const cookieStore = await cookies()
    const contractorId = cookieStore.get('contractor_id')?.value

    if (!contractorId) {
        return redirect('/login')
    }

    const { createAdminClient } = await import("@/utils/supabase/admin")
    const supabase = createAdminClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_fee, full_name')
        .eq('id', contractorId)
        .single()

    if (!profile) {
        throw new Error('Profile not found')
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'jpy',
                    product_data: {
                        name: `Parking Fee - ${targetMonth}`,
                        description: `Monthly parking fee for ${profile.full_name}`,
                    },
                    unit_amount: profile.monthly_fee,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/portal?success=true&month=${targetMonth}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/portal?canceled=true`,
        metadata: {
            userId: contractorId,
            targetMonth: targetMonth,
        },
    })

    if (session.url) {
        redirect(session.url)
    }
}
