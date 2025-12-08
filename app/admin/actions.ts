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
    const paymentMethod = formData.get('paymentMethod') as string || 'cash'

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
            payment_method: paymentMethod,
        })

    if (error) {
        console.error('Error creating manual payment:', error)
        return { error: '入金記録の作成に失敗しました' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function updateOwnerSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const companyName = formData.get('companyName') as string
    const address = formData.get('address') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const bankName = formData.get('bankName') as string
    const branchName = formData.get('branchName') as string
    const accountType = formData.get('accountType') as string
    const accountNumber = formData.get('accountNumber') as string
    const accountHolder = formData.get('accountHolder') as string

    // Update the owner profile. We assume there is only one owner profile linked to this auth user
    const { error } = await supabase
        .from('profiles')
        .update({
            company_name: companyName,
            address: address,
            invoice_registration_number: invoiceNumber,
            bank_name: bankName,
            bank_branch_name: branchName,
            account_type: accountType,
            account_number: accountNumber,
            account_holder_name: accountHolder,
        })
        .eq('role', 'owner')
        .eq('auth_id', user.id)

    if (error) {
        console.error('Error updating owner settings:', error)
        return { error: '設定の保存に失敗しました' }
    }

    revalidatePath('/admin/settings')
    return { success: true }
}
