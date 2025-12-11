'use client'

import { useState, useTransition } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { reportBankTransfer } from "./actions"

interface BankTransferDialogProps {
    contractorId: string
    unpaidMonths: string[]
    monthlyFee: number
}

export function BankTransferDialog({
    contractorId,
    unpaidMonths,
    monthlyFee,
}: BankTransferDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [selectedMonths, setSelectedMonths] = useState<string[]>([])

    const handleSubmit = (formData: FormData) => {
        if (selectedMonths.length === 0) return

        formData.append('months', JSON.stringify(selectedMonths))

        startTransition(async () => {
            const result = await reportBankTransfer(formData)
            if (result?.error) {
                alert(result.error)
            } else {
                setOpen(false)
                setSelectedMonths([])
            }
        })
    }

    const toggleMonth = (month: string) => {
        setSelectedMonths(prev =>
            prev.includes(month)
                ? prev.filter(m => m !== month)
                : [...prev, month].sort()
        )
    }

    const totalAmount = selectedMonths.length * monthlyFee

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    銀行振込完了を報告する
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>振込報告</DialogTitle>
                    <DialogDescription>
                        銀行振込が完了した月を選択し、振込名義を入力してください。
                        オーナーが確認後、支払済となります。
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="contractorId" value={contractorId} />

                    <div className="space-y-2">
                        <Label>支払い対象月</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                            {unpaidMonths.length === 0 ? (
                                <p className="text-sm text-gray-500">未払いの月はありません</p>
                            ) : (
                                unpaidMonths.map((month) => (
                                    <div key={month} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`month-${month}`}
                                            checked={selectedMonths.includes(month)}
                                            onCheckedChange={() => toggleMonth(month)}
                                        />
                                        <label
                                            htmlFor={`month-${month}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {month} (¥{monthlyFee.toLocaleString()})
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="text-right text-sm font-bold">
                            合計: ¥{totalAmount.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transferName">振込名義（カナ）</Label>
                        <Input
                            id="transferName"
                            name="transferName"
                            placeholder="ヤマダ タロウ"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            通帳に記載される名前を入力してください。
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transferDate">振込日</Label>
                        <Input
                            id="transferDate"
                            name="transferDate"
                            type="date"
                            defaultValue={new Date().toISOString().slice(0, 10)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending || selectedMonths.length === 0}>
                            {isPending ? "送信中..." : "報告する"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
