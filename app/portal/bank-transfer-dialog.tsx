'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { reportBankTransfer } from "./actions"
import { ArrowLeft } from "lucide-react"

interface BankTransferDialogProps {
    contractorId: string
    targetMonths: string[]
    monthlyFee: number
    owner: {
        bank_name: string | null
        bank_branch_name: string | null
        account_type: string | null
        account_number: string | null
        account_holder_name: string | null
    }
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function BankTransferDialog({
    contractorId,
    targetMonths,
    monthlyFee,
    owner,
    trigger,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: BankTransferDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [step, setStep] = useState<'info' | 'form'>('info')

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    const setOpen = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset step when closing
            setTimeout(() => setStep('info'), 300)
        }
        if (isControlled) {
            setControlledOpen?.(newOpen)
        } else {
            setInternalOpen(newOpen)
        }
    }

    const [transferName, setTransferName] = useState("")
    const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10))
    const [isSubmitting, setIsSubmitting] = useState(false)

    const totalAmount = targetMonths.length * monthlyFee

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Final confirmation is still good, but maybe redundant if we have 2 steps.
        // Let's keep it simple: "Confirm?"
        if (!confirm('入力内容に間違いはありませんか？')) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('contractorId', contractorId)
            formData.append('months', JSON.stringify(targetMonths))
            formData.append('transferName', transferName)
            formData.append('transferDate', transferDate)

            const result = await reportBankTransfer(formData)
            if (result?.error) {
                alert(result.error)
            } else {
                setOpen(false)
                setTransferName("")
                setStep('info')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto transition-all rounded-lg">
                {step === 'info' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>STEP 1. 振込先の確認</DialogTitle>
                            <DialogDescription>
                                まずは以下の口座へ、合計金額をお振込みください。<br />
                                <strong>お振込みが完了してから</strong>、次へ進んでください。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 sm:space-y-6 py-4">
                            {/* Amount Info */}
                            <div className="text-center p-4 sm:p-6 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                                <div className="text-sm text-indigo-600 font-medium mb-1">振込合計金額</div>
                                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-700">
                                    ¥{totalAmount.toLocaleString()}
                                </div>
                                <div className="text-sm text-indigo-400 mt-2">
                                    対象: {targetMonths.length > 1
                                        ? `${targetMonths[0]} 〜 ${targetMonths[targetMonths.length - 1]}`
                                        : targetMonths[0]
                                    } ({targetMonths.length}ヶ月分)
                                </div>
                            </div>

                            {/* Bank Info Section */}
                            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                                    <span>🏦</span> 振込先口座
                                </h4>
                                <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[80px_1fr] gap-x-3 sm:gap-x-4 gap-y-3 text-sm">
                                    <div className="text-gray-500 whitespace-nowrap">銀行名</div>
                                    <div className="font-bold text-base">{owner.bank_name}</div>

                                    <div className="text-gray-500 whitespace-nowrap">支店名</div>
                                    <div className="font-bold text-base">{owner.bank_branch_name}</div>

                                    <div className="text-gray-500 whitespace-nowrap">口座種別</div>
                                    <div className="font-medium">{owner.account_type === 'current' ? '当座' : '普通'}</div>

                                    <div className="text-gray-500 whitespace-nowrap">口座番号</div>
                                    <div className="font-mono font-bold text-lg tracking-wider">{owner.account_number}</div>

                                    <div className="text-gray-500 self-center whitespace-nowrap">口座名義</div>
                                    <div className="font-bold text-base text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block break-all">
                                        {owner.account_holder_name}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2 flex flex-col sm:flex-col sm:space-x-0 gap-3">
                                <Button
                                    className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md"
                                    onClick={() => setStep('form')}
                                >
                                    振込手続きが完了しました
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-2 w-full">
                                    ※まだ振込がお済みでない場合は、この画面を閉じてください。
                                </p>
                            </DialogFooter>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                STEP 2. 振込完了の報告
                            </DialogTitle>
                            <DialogDescription>
                                お振込みいただいた内容を入力してください。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="bg-green-50 px-4 py-3 rounded text-green-800 text-sm font-medium flex items-center gap-2">
                                <span className="text-lg">✅</span>
                                振込手続き完了済み
                            </div>

                            {/* Report Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="transferName">振込名義（カナ）</Label>
                                    <Input
                                        id="transferName"
                                        value={transferName}
                                        onChange={(e) => setTransferName(e.target.value)}
                                        placeholder="ヤマダ タロウ"
                                        className="text-lg"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        ※実際に振込を行った際の名前（依頼人名）を入力してください。
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="transferDate">振込日</Label>
                                    <Input
                                        id="transferDate"
                                        type="date"
                                        value={transferDate}
                                        onChange={(e) => setTransferDate(e.target.value)}
                                        className="text-lg"
                                        required
                                    />
                                </div>

                                <DialogFooter className="pt-4 flex items-center gap-2 sm:justify-between">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep('info')}
                                        className="text-gray-500"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        戻る
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-11 text-base">
                                        {isSubmitting ? "送信中..." : "報告を送信する"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
