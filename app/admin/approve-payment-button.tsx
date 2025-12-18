'use client'

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { approvePayments } from "./actions"

export function ApprovePaymentButton({ paymentIds }: { paymentIds: string[] }) {
    const [isPending, startTransition] = useTransition()

    const handleApprove = () => {
        if (!confirm(`この振込（${paymentIds.length}ヶ月分の申請）を承認し、支払い済みにしますか？`)) return

        startTransition(async () => {
            const result = await approvePayments(paymentIds)
            if (result?.error) {
                alert(result.error)
            }
        })
    }

    return (
        <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
        >
            {isPending ? "処理中..." : "承認"}
        </Button>
    )
}
