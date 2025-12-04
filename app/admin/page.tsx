import { createClient } from "@/utils/supabase/server"
import { AddContractorDialog } from "./add-contractor-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
    const supabase = await createClient()

    // Fetch contractors
    const { data: contractors } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "contractor")
        .order("created_at", { ascending: false })

    // Fetch payments for current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: payments } = await supabase
        .from("payments")
        .select("user_id, status")
        .eq("target_month", currentMonth)
        .eq("status", "succeeded")

    // Map payment status
    const paidUserIds = new Set(payments?.map((p) => p.user_id))

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <AddContractorDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contractors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contractors?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{paidUserIds.size}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contractors</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Monthly Fee</TableHead>
                                <TableHead>Status ({currentMonth})</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contractors?.map((contractor) => {
                                const isPaid = paidUserIds.has(contractor.id)
                                return (
                                    <TableRow key={contractor.id}>
                                        <TableCell className="font-medium">{contractor.full_name}</TableCell>
                                        <TableCell>¥{contractor.monthly_fee.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {isPaid ? (
                                                <Badge className="bg-green-500">Paid</Badge>
                                            ) : (
                                                <Badge variant="destructive">Unpaid</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Add Edit/Delete buttons here if needed */}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {(!contractors || contractors.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500">
                                        No contractors found.
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
