import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/login/actions"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    // Optional: Check if user has 'owner' role in profiles
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_id", user.id)
        .single()

    if (profile?.role !== "owner") {
        // If not owner, maybe redirect to portal or show error
        // For now, assuming only owners have auth accounts
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
                    <form action={logout}>
                        <Button variant="outline" size="sm">
                            Sign Out
                        </Button>
                    </form>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
