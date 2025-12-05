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

    // Fetch all contractors
    const { data: contractors } = await supabase
        .from('profiles')
        .select('id, full_name, monthly_fee, phone_number, contract_start_month, contract_end_month')
        .eq('role', 'contractor')
        .order('full_name')

    // Fetch payments for current month
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    // Fetch this month's payments
    const { data: payments } = await supabase
        .from('payments')
        .select('user_id')
        .eq('status', 'succeeded')
        .eq('target_month', currentMonth)

    // Map payment status
    const paidUserIds = new Set(payments?.map(p => p.user_id))

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
                        <div className="text-2xl font-bold">{paidUserIds.size}</div>
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
                                <TableHead>ステータス ({currentMonth})</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contractors?.map((contractor) => {
                                const isPaid = paidUserIds.has(contractor.id)
                                return (
                                    <TableRow key={contractor.id}>
                                        <TableCell className="font-medium">{contractor.full_name}</TableCell>
                                        <TableCell>{contractor.phone_number || '-'}</TableCell>
                                        <TableCell>¥{contractor.monthly_fee.toLocaleString()}</TableCell>
                                        <TableCell className="text-sm">
                                            {contractor.contract_start_month || '-'} 〜 {contractor.contract_end_month || '無期限'}
                                        </TableCell>
                                        <TableCell>
                                            {isPaid ? (
                                                <Badge className="bg-green-500">支払済</Badge>
                                            ) : (
                                                <Badge variant="destructive">未払</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {(!contractors || contractors.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500">
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
