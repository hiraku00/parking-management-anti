'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { approvePayment } from "./actions"

interface ApprovePaymentButtonProps {
    paymentId: string
}

export function ApprovePaymentButton({ paymentId }: ApprovePaymentButtonProps) {
    const [isPending, startTransition] = useTransition()

    const handleApprove = () => {
        if (!confirm('この振込を承認し、支払い済みにしますか？')) return

        startTransition(async () => {
            const result = await approvePayment(paymentId)
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
