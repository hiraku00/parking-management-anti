import { createClient } from "@/utils/supabase/server"
import { AddContractorDialog } from "./add-contractor-dialog"
import { EditContractorDialog } from "./edit-contractor-dialog"
import { DeleteContractorButton } from "./delete-contractor-button"
import { ManualPaymentDialog } from "./manual-payment-dialog"
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

    // Fetch all contractors
    const { data: contractors } = await supabase
        .from('profiles')
        .select('id, full_name, monthly_fee, phone_number, contract_start_month, contract_end_month')
        .eq('role', 'contractor')
        .order('full_name')

    // Fetch all successful payments to calculate arrears
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id, target_month')
        .eq('status', 'succeeded')

    // Group payments by user
    const userPaidMonths = new Map<string, Set<string>>()
    payments?.forEach(p => {
        if (!userPaidMonths.has(p.user_id)) {
            userPaidMonths.set(p.user_id, new Set())
        }
        userPaidMonths.get(p.user_id)?.add(p.target_month)
    })

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const currentMonthPaidCount = payments?.filter(p => p.target_month === currentMonth).length || 0

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">概要</h2>
                <AddContractorDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">契約者総数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contractors?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今月の支払済</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currentMonthPaidCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>契約者一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>氏名</TableHead>
                                <TableHead>電話番号</TableHead>
                                <TableHead>月額料金</TableHead>
                                <TableHead>契約期間</TableHead>
                                <TableHead>ステータス</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contractors?.map((contractor) => {
                                const paidMonths = userPaidMonths.get(contractor.id) || new Set()

                                // Calculate unpaid months logic (same as portal)
                                const months = []
                                const contractStart = contractor.contract_start_month || currentMonth
                                const startDate = new Date(contractStart + '-01')
                                const endDate = new Date(currentMonth + '-01')

                                // If contract has ended, clamp to end date
                                const actualEndDate = contractor.contract_end_month
                                    ? new Date(Math.min(new Date(contractor.contract_end_month + '-01').getTime(), endDate.getTime()))
                                    : endDate

                                for (let d = new Date(startDate); d <= actualEndDate; d.setMonth(d.getMonth() + 1)) {
                                    months.push(d.toISOString().slice(0, 7))
                                }

                                const unpaidMonths = months.filter(m => !paidMonths.has(m))
                                const unpaidPastCount = unpaidMonths.filter(m => m < currentMonth).length
                                const isCurrentMonthUnpaid = unpaidMonths.includes(currentMonth)

                                return (
                                    <TableRow key={contractor.id}>
                                        <TableCell className="font-medium">{contractor.full_name}</TableCell>
                                        <TableCell>{contractor.phone_number || '-'}</TableCell>
                                        <TableCell>¥{contractor.monthly_fee.toLocaleString()}</TableCell>
                                        <TableCell className="text-sm">
                                            {contractor.contract_start_month || '-'} 〜 {contractor.contract_end_month || '無期限'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {unpaidPastCount > 0 && (
                                                    <Badge variant="destructive">滞納 {unpaidPastCount}ヶ月</Badge>
                                                )}
                                                {isCurrentMonthUnpaid ? (
                                                    <Badge variant="outline" className="text-red-500 border-red-500">
                                                        今月未払
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-500">今月支払済</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <ManualPaymentDialog
                                                    contractorId={contractor.id}
                                                    contractorName={contractor.full_name}
                                                    monthlyFee={contractor.monthly_fee}
                                                    unpaidMonths={unpaidMonths}
                                                />
                                                <EditContractorDialog contractor={contractor} />
                                                <DeleteContractorButton id={contractor.id} name={contractor.full_name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {(!contractors || contractors.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500">
                                        契約者が見つかりません。
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
