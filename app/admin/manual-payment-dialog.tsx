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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { createManualPayment } from "./actions"
import { BadgeJapaneseYen } from "lucide-react"

type ManualPaymentDialogProps = {
    contractorId: string
    contractorName: string
    monthlyFee: number
    unpaidMonths: string[]
}

export function ManualPaymentDialog({ contractorId, contractorName, monthlyFee, unpaidMonths }: ManualPaymentDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set())

    const handleMonthToggle = (month: string) => {
        const newSelected = new Set(selectedMonths)
        if (newSelected.has(month)) {
            newSelected.delete(month)
        } else {
            newSelected.add(month)
        }
        setSelectedMonths(newSelected)
    }

    async function handleSubmit() {
        if (selectedMonths.size === 0) return

        if (!confirm(`${selectedMonths.size}ヶ月分の入金を消込しますか？`)) {
            return
        }

        // Process sequentially to keep simple logic (could be parallelized)
        for (const month of Array.from(selectedMonths)) {
            const formData = new FormData()
            formData.append('userId', contractorId)
            formData.append('amount', monthlyFee.toString())
            formData.append('targetMonth', month)

            const result = await createManualPayment(formData)
            if (result?.error) {
                alert(`${month}分の消込に失敗しました: ${result.error}`)
            }
        }

        setOpen(false)
        setSelectedMonths(new Set())
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                    <BadgeJapaneseYen className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>手動入金消込</DialogTitle>
                    <DialogDescription>
                        {contractorName}さんの未払い月を入金済みとして記録します。<br />
                        現金や振込で受領した場合に使用してください。
                    </DialogDescription>
                </DialogHeader>

                {unpaidMonths.length === 0 ? (
                    <div className="py-6 text-center text-gray-500">
                        未払いの月はありません。
                    </div>
                ) : (
                    <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto">
                        <p className="text-sm font-medium mb-2">未払い月一覧</p>
                        {unpaidMonths.map((month) => (
                            <div key={month} className="flex items-center space-x-2 border p-3 rounded-md">
                                <Checkbox
                                    id={`month-${month}`}
                                    checked={selectedMonths.has(month)}
                                    onCheckedChange={() => handleMonthToggle(month)}
                                />
                                <Label htmlFor={`month-${month}`} className="flex-1 cursor-pointer flex justify-between items-center">
                                    <span>{month}</span>
                                    <span className="text-gray-500">¥{monthlyFee.toLocaleString()}</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <div className="flex w-full justify-between items-center">
                        <span className="font-bold">
                            合計: ¥{(selectedMonths.size * monthlyFee).toLocaleString()}
                        </span>
                        <Button onClick={handleSubmit} disabled={selectedMonths.size === 0}>
                            消込実行
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
