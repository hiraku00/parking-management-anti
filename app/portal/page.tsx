import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createCheckoutSession } from "./actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CollapsibleSection } from "@/components/collapsible-section"

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

    // Fetch contractor profile
    const { data: contractor } = await supabase
        .from("profiles")
        .select("full_name, contract_start_month, contract_end_month, monthly_fee")
        .eq("id", contractorId)
        .single()

    // Fetch payments
    const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", contractorId)
        .order("created_at", { ascending: false })

    const paidMonths = new Set(payments?.filter(p => p.status === 'succeeded').map((p) => p.target_month))

    // Generate list of months from contract start to current month only (no future months)
    const today = new Date()
    const currentMonthStr = today.toISOString().slice(0, 7)
    const contractStartMonth = contractor?.contract_start_month || currentMonthStr
    const contractEndMonth = contractor?.contract_end_month // Can be null (indefinite)

    const months = []
    const startDate = new Date(contractStartMonth + '-01')
    const endDate = new Date(currentMonthStr + '-01') // Only up to current month

    // If contract has ended, don't show months after end date
    const actualEndDate = contractEndMonth
        ? new Date(Math.min(new Date(contractEndMonth + '-01').getTime(), endDate.getTime()))
        : endDate

    for (let d = new Date(startDate); d <= actualEndDate; d.setMonth(d.getMonth() + 1)) {
        months.push(d.toISOString().slice(0, 7))
    }

    // Filter to show only unpaid months
    const unpaidMonths = months.filter(m => !paidMonths.has(m))

    return (
        <div className="space-y-6">
            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-md">
                    {month}のお支払いが完了しました。ありがとうございます。
                </div>
            )}

            {/* Unpaid Months */}
            <Card>
                <CardHeader>
                    <CardTitle>未払いの月額料金</CardTitle>
                    <CardDescription>お支払いが必要な月が表示されます。</CardDescription>
                </CardHeader>
                <CardContent>
                    {unpaidMonths.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            すべてのお支払いが完了しています。
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {unpaidMonths.map((m) => {
                                const isPast = m < currentMonthStr
                                const isCurrent = m === currentMonthStr

                                return (
                                    <div
                                        key={m}
                                        className={`flex items-center justify-between p-4 border-2 rounded-lg ${isCurrent ? 'border-blue-500 bg-blue-50' :
                                            isPast ? 'border-red-300 bg-red-50' :
                                                'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="font-medium text-lg">{m}</span>
                                            {isCurrent && <Badge className="bg-blue-600">今月</Badge>}
                                            {isPast && <Badge variant="destructive">未払い</Badge>}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-semibold">
                                                ¥{contractor?.monthly_fee.toLocaleString()}
                                            </span>
                                            <form action={createCheckoutSession}>
                                                <input type="hidden" name="targetMonth" value={m} />
                                                <Button
                                                    type="submit"
                                                    variant={isPast ? "destructive" : "default"}
                                                    size="lg"
                                                >
                                                    支払う
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment History - Collapsible */}
            <CollapsibleSection title="支払い履歴" defaultOpen={false}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>日付</TableHead>
                            <TableHead>対象月</TableHead>
                            <TableHead>金額</TableHead>
                            <TableHead>ステータス</TableHead>
                            <TableHead>領収書</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.created_at).toLocaleDateString('ja-JP')}</TableCell>
                                <TableCell>{payment.target_month}</TableCell>
                                <TableCell>¥{payment.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={payment.status === 'succeeded' ? 'default' : 'secondary'}>
                                        {payment.status === 'succeeded' ? '支払済' : payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {payment.status === 'succeeded' && (
                                        <div className="flex items-center gap-2">
                                            <a href={`/portal/receipt/${payment.id}`} target="_blank" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
                                                <span>📄</span>
                                                発行
                                            </a>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!payments || payments.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500">
                                    支払い履歴がありません。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CollapsibleSection>
        </div>
    )
}
