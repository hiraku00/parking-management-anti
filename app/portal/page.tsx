import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createCheckoutSession } from "./actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function PortalPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; month?: string }>
}) {
    const { success, month } = await searchParams
    const cookieStore = await cookies()
    const contractorId = cookieStore.get("contractor_id")?.value

    // Use Admin Client to bypass RLS for custom contractor auth
    const { createAdminClient } = await import("@/utils/supabase/admin")
    const supabase = createAdminClient()

    // Fetch payments
    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", contractorId)
        .order("created_at", { ascending: false })

    const paidMonths = new Set(payments?.filter(p => p.status === 'succeeded').map((p) => p.target_month))

    // Generate list of relevant months (e.g., current year)
    const today = new Date()
    const currentMonthStr = today.toISOString().slice(0, 7)
    const months = []
    for (let i = -3; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
        months.push(d.toISOString().slice(0, 7))
    }

    return (
        <div className="space-y-6">
            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4">
                    Payment for {month} successful! Thank you.
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Monthly Payments</CardTitle>
                    <CardDescription>Pay your parking fees here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {months.map((m) => {
                            const isPaid = paidMonths.has(m)
                            const isPast = m < currentMonthStr
                            const isCurrent = m === currentMonthStr

                            return (
                                <div
                                    key={m}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-lg">{m}</span>
                                        {isCurrent && <Badge>Current</Badge>}
                                    </div>
                                    <div>
                                        {isPaid ? (
                                            <Badge className="bg-green-500">Paid</Badge>
                                        ) : (
                                            <form action={createCheckoutSession}>
                                                <input type="hidden" name="targetMonth" value={m} />
                                                <Button type="submit" variant={isPast ? "destructive" : "default"}>
                                                    Pay Now
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Month</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{payment.target_month}</TableCell>
                                    <TableCell>¥{payment.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'}>
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!payments || payments.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500">
                                        No payment history.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
