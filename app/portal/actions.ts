'use server'

import { stripe } from '@/utils/stripe/server'
import Stripe from 'stripe'
import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/auth'
import { createCheckoutSessionSchema, reportBankTransferSchema } from '@/lib/validations'

export async function createCheckoutSession(formData: FormData) {
    const authSession = await getSession()
    const contractorId = authSession?.id

    if (!contractorId) {
        return redirect('/login?message=セッションが切れました。再度ログインしてください。')
    }

    // Validate input
    const validation = createCheckoutSessionSchema.safeParse({
        months: formData.get('months'),
    })

    if (!validation.success) {
        const error = validation.error.issues[0]?.message || '入力エラーが発生しました'
        throw new Error(error)
    }

    const { months: targetMonths } = validation.data
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
        throw new Error('プロファイルが見つかりません')
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = targetMonths.map(month => ({
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
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/portal?success=true&months=${encodeURIComponent(JSON.stringify(targetMonths))}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/portal?canceled=true`,
        metadata: {
            userId: contractorId as string,
            targetMonths: JSON.stringify(targetMonths),
        },
    })

    if (session.url) {
        redirect(session.url)
    }
}

export async function reportBankTransfer(formData: FormData) {
    // Validate input
    const validation = reportBankTransferSchema.safeParse({
        contractorId: formData.get('contractorId'),
        months: formData.get('months'),
        transferName: formData.get('transferName'),
        transferDate: formData.get('transferDate'),
    })

    if (!validation.success) {
        const error = validation.error.issues[0]?.message || '入力エラーが発生しました'
        return { error }
    }

    const { contractorId, months: inputMonths, transferName, transferDate } = validation.data

    const { createAdminClient } = await import("@/utils/supabase/admin")
    const supabase = createAdminClient()

    // Fetch monthly fee from profile FIRST (fixing hardcoded amount bug)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('monthly_fee')
        .eq('id', contractorId)
        .single()

    if (profileError || !profile) {
        return { error: 'プロファイルが見つかりません' }
    }

    // Create payment records for each month with correct amount
    const records = inputMonths.map(month => ({
        user_id: contractorId,
        amount: profile.monthly_fee, // Use actual monthly fee from profile
        currency: 'jpy',
        status: 'pending', // Pending approval
        target_month: month,
        payment_method: 'bank_transfer',
        metadata: {
            transfer_name: transferName,
            transfer_date: transferDate
        }
    }))

    const { error } = await supabase
        .from('payments')
        .insert(records)

    if (error) {
        console.error('Payment report error:', error)
        return { error: '報告の送信に失敗しました' }
    }

    // Revalidate paths
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/portal')
    revalidatePath('/admin')

    return { success: true }
}
