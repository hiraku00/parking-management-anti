'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function loginOwner(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    return redirect('/admin')
}

export async function loginContractor(formData: FormData) {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string

    const { createAdminClient } = await import("@/utils/supabase/admin")
    const supabase = createAdminClient()

    // Find profile by name and phone_last4
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, phone_last4')
        .eq('full_name', name)
        .eq('role', 'contractor')
        .single()

    if (error || !profile) {
        return redirect('/login?message=Contractor not found')
    }

    // Verify phone_last4
    if (profile.phone_last4 !== phone) {
        return redirect('/login?message=Invalid phone number')
    }

    // Set secure cookie for contractor session
    const cookieStore = await cookies()
    cookieStore.set('contractor_id', profile.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return redirect('/portal')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    cookieStore.delete('contractor_id')

    return redirect('/login')
}
