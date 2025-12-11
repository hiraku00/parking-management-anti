import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createCheckoutSession } from "./actions"
import { calculateUnpaidMonths } from "@/utils/calculation"
import { BankTransferDialog } from "./bank-transfer-dialog"
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

    // Fetch owner profile for bank details
    const { data: owner } = await supabase
        .from("profiles")
        .select("bank_name, bank_branch_name, account_type, account_number, account_holder_name")
        .eq("role", "owner")
        .single()

    const paidMonths = new Set(payments?.filter(p => p.status === 'succeeded').map((p) => p.target_month))
    const pendingMonths = new Set(payments?.filter(p => p.status === 'pending').map((p) => p.target_month))

    const today = new Date()
    const currentMonthStr = today.toISOString().slice(0, 7)

    // unpaidMonthsFromCalc includes months that are NOT succeeded. 
    // This INCLUDES pending months.
    const unpaidMonthsFromCalc = calculateUnpaidMonths(
        contractor?.contract_start_month || null,
        contractor?.contract_end_month || null,
        paidMonths
    )

    // Truely unpaid (not paid AND not pending) user for BankTransferDialog
    const eligibleForTransferMonths = unpaidMonthsFromCalc.filter(m => !pendingMonths.has(m))

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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>お支払いが必要な月</CardTitle>
                            <CardDescription className="mt-1">
                                クレジットカード決済は各月の行にあるボタンから、銀行振込はページ下部の案内をご覧ください。
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {unpaidMonthsFromCalc.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            すべてのお支払いが完了しています。
                        </p>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {unpaidMonthsFromCalc.map((m) => {
                                    const isPast = m < currentMonthStr
                                    const isCurrent = m === currentMonthStr
                                    const isPending = pendingMonths.has(m)

                                    return (
                                        <div
                                            key={m}
                                            className={`flex items-center justify-between p-4 border-2 rounded-lg 
                                                ${isPending ? 'border-yellow-400 bg-yellow-50' :
                                                    isCurrent ? 'border-blue-500 bg-blue-50' :
                                                        isPast ? 'border-red-300 bg-red-50' :
                                                            'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="font-medium text-lg">{m}</span>
                                                {isPending && <Badge className="bg-yellow-500 hover:bg-yellow-600">確認中</Badge>}
                                                {isCurrent && !isPending && <Badge className="bg-blue-600">今月</Badge>}
                                                {isPast && !isPending && <Badge variant="destructive">未払い</Badge>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-semibold">
                                                    ¥{contractor?.monthly_fee.toLocaleString()}
                                                </span>
                                                {isPending ? (
                                                    <span className="text-sm text-yellow-700 font-medium">
                                                        振込確認中
                                                    </span>
                                                ) : (
                                                    <form action={createCheckoutSession}>
                                                        <input type="hidden" name="targetMonth" value={m} />
                                                        <Button
                                                            type="submit"
                                                            variant={isPast ? "destructive" : "default"}
                                                            size="lg"
                                                        >
                                                            カードで支払う
                                                        </Button>
                                                    </form>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>


                            {/* Bank Transfer Information (Embedded as an alternative option) */}
                            {/* Bank Transfer Information */}
                            {owner?.bank_name && (
                                <div className="mt-8 pt-8 border-t-2 border-dashed">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <span>🏦</span> 銀行振込でのお支払い
                                        </h3>
                                        {eligibleForTransferMonths.length > 0 && (
                                            <BankTransferDialog
                                                contractorId={contractorId || ""}
                                                unpaidMonths={eligibleForTransferMonths}
                                                monthlyFee={contractor?.monthly_fee || 0}
                                            />
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-lg text-sm border">
                                        <p className="mb-4 text-base text-gray-800 font-medium">
                                            以下の口座へお振込み後、「銀行振込完了を報告する」ボタンからご連絡ください。
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6 bg-white p-4 rounded border shadow-sm">
                                            <div className="flex justify-between sm:justify-start sm:gap-4 border-b sm:border-b-0 pb-2 sm:pb-0">
                                                <span className="text-gray-500 w-24">銀行名</span>
                                                <span className="font-bold text-lg">{owner.bank_name}</span>
                                            </div>
                                            <div className="flex justify-between sm:justify-start sm:gap-4 border-b sm:border-b-0 pb-2 sm:pb-0">
                                                <span className="text-gray-500 w-24">支店名</span>
                                                <span className="font-bold text-lg">{owner.bank_branch_name}</span>
                                            </div>
                                            <div className="flex justify-between sm:justify-start sm:gap-4 border-b sm:border-b-0 pb-2 sm:pb-0">
                                                <span className="text-gray-500 w-24">口座種別</span>
                                                <span className="font-medium">
                                                    {owner.account_type === 'current' ? '当座' : '普通'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between sm:justify-start sm:gap-4 border-b sm:border-b-0 pb-2 sm:pb-0">
                                                <span className="text-gray-500 w-24">口座番号</span>
                                                <span className="font-bold text-xl tracking-wider">{owner.account_number}</span>
                                            </div>
                                            <div className="col-span-1 sm:col-span-2 flex justify-between sm:justify-start sm:gap-4 border-t pt-3 mt-2">
                                                <span className="text-gray-500 w-24">口座名義</span>
                                                <span className="font-bold text-lg">{owner.account_holder_name}</span>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex gap-3 text-blue-900">
                                            <div className="text-2xl">💡</div>
                                            <div>
                                                <strong>振込後の手順:</strong>
                                                <ol className="list-decimal list-inside mt-1 space-y-1">
                                                    <li>銀行で振込手続きを行ってください。</li>
                                                    <li>右上の<strong>「銀行振込完了を報告する」</strong>ボタンを押してください。</li>
                                                    <li>振込日と名義を入力して送信すると、支払い確認待ちの状態になります。</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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
