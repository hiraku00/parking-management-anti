import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/login/actions"

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const contractorId = cookieStore.get("contractor_id")?.value

    if (!contractorId) {
        return redirect("/login")
    }

    // Use Admin Client for custom auth
    const { createAdminClient } = await import("@/utils/supabase/admin")
    const supabase = createAdminClient()
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", contractorId)
        .single()

    if (!profile) {
        return redirect("/login")
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">
                        Welcome, {profile.full_name}
                    </h1>
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
