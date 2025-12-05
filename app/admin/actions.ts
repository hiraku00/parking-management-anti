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

export async function deleteContractor(formData: FormData) {
    const id = formData.get('id') as string
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Failed to delete contractor' }
    }

    revalidatePath('/admin')
    return { success: true }
}
