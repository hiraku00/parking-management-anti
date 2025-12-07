'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addContractor(formData: FormData) {
    const name = formData.get('name') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const monthlyFee = parseInt(formData.get('monthlyFee') as string)
    const contractStart = formData.get('contractStart') as string
    const contractEnd = formData.get('contractEnd') as string || null

    // Extract last 4 digits from phone number
    const phoneLast4 = phoneNumber.replace(/\D/g, '').slice(-4)

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .insert({
            full_name: name,
            role: 'contractor',
            monthly_fee: monthlyFee,
            phone_number: phoneNumber,
            phone_last4: phoneLast4,
            contract_start_month: contractStart,
            contract_end_month: contractEnd,
        })

    if (error) {
        console.error('Error adding contractor:', error)
        return { error: 'Failed to add contractor' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function updateContractor(formData: FormData) {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const phoneNumber = formData.get('phoneNumber') as string
    const monthlyFee = parseInt(formData.get('monthlyFee') as string)
    const contractStart = formData.get('contractStart') as string
    const contractEnd = formData.get('contractEnd') as string || null

    // Extract last 4 digits from phone number
    const phoneLast4 = phoneNumber.replace(/\D/g, '').slice(-4)

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: name,
            monthly_fee: monthlyFee,
            phone_number: phoneNumber,
            phone_last4: phoneLast4,
            contract_start_month: contractStart,
            contract_end_month: contractEnd,
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating contractor:', error)
        return { error: 'Failed to update contractor' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function deleteContractor(formData: FormData) {
    const id = formData.get('id') as string
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting contractor:', error)
        // Check for foreign key violation (e.g., payment history exists)
        if (error.code === '23503') {
            return { error: '支払い履歴があるため削除できません。' }
        }
        return { error: '契約者の削除に失敗しました' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function createManualPayment(formData: FormData) {
    const userId = formData.get('userId') as string
    const amount = parseInt(formData.get('amount') as string)
    const targetMonth = formData.get('targetMonth') as string

    const supabase = await createClient()

    const { error } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            amount: amount,
            currency: 'jpy',
            status: 'succeeded',
            target_month: targetMonth,
            stripe_session_id: 'manual_entry', // Mark as manual payment
        })

    if (error) {
        console.error('Error creating manual payment:', error)
        return { error: '入金記録の作成に失敗しました' }
    }

    revalidatePath('/admin')
    return { success: true }
}
