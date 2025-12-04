'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addContractor(formData: FormData) {
    const name = formData.get('name') as string
    const monthlyFee = parseInt(formData.get('monthlyFee') as string)
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .insert({
            full_name: name,
            role: 'contractor',
            monthly_fee: monthlyFee,
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
