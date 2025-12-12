'use server'

import { stripe } from '@/utils/stripe/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(formData: FormData) {
    // Expecting a JSON array string of months: '["2024-03", "2024-04"]'
    const monthsStr = formData.get('months') as string
    const cookieStore = await cookies()
    const contractorId = cookieStore.get('contractor_id')?.value

    if (!contractorId) {
        return redirect('/login?message=セッションが切れました。再度ログインしてください。')
    }

    if (!monthsStr) {
        throw new Error('No months selected')
    }

    const targetMonths = JSON.parse(monthsStr) as string[]
    // Sort months just in case
    targetMonths.sort()

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

    const lineItems = targetMonths.map(month => ({
        price_data: {
            currency: 'jpy',
            product_data: {
                name: `Parking Fee - ${month}`,
                description: `Monthly parking fee for ${profile.full_name}`,
            },
            unit_amount: profile.monthly_fee,
        },
        quantity: 1,
    }))

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/portal?success=true`, // Handle success generally
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/portal?canceled=true`,
        metadata: {
            userId: contractorId,
            targetMonths: JSON.stringify(targetMonths), // Store as JSON string
        },
    })

    if (session.url) {
        redirect(session.url)
    }
}

export async function reportBankTransfer(formData: FormData) {
    const contractorId = formData.get('contractorId') as string
    const monthsStr = formData.get('months') as string
    const transferName = formData.get('transferName') as string
    const transferDate = formData.get('transferDate') as string

    if (!contractorId || !monthsStr || !transferName || !transferDate) {
        return { error: '必要な情報が不足しています。' }
    }

    const inputMonths = JSON.parse(monthsStr) as string[]

    const { createAdminClient } = await import("@/utils/supabase/admin")
    const supabase = createAdminClient()

    // Create payment records for each month
    const records = inputMonths.map(month => ({
        user_id: contractorId,
        amount: 3000, // Ideally fetch this from profile, but passed in dialog for display. Fetching again for safety.
        currency: 'jpy',
        status: 'pending', // Pending approval
        target_month: month,
        payment_method: 'bank_transfer',
        metadata: {
            transfer_name: transferName,
            transfer_date: transferDate
        }
    }))

    // Fetch monthly fee to be safe
    const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_fee')
        .eq('id', contractorId)
        .single()

    if (profile) {
        records.forEach(r => r.amount = profile.monthly_fee)
    }

    const { error } = await supabase
        .from('payments')
        .insert(records)

    if (error) {
        console.error('Payment report error:', error)
        return { error: '報告の送信に失敗しました。' }
    }

    // Revalidate paths
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/portal')
    revalidatePath('/admin')

    return { success: true }
}
