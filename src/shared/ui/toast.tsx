"use client"

import { useEffect, useState } from "react"
import { CheckCircle, X, Copy, ExternalLink } from "lucide-react"
import { Button } from "./button"

type ToastProps = {
    type: "success" | "error" | "bot_required"
    message: string
    botUsername?: string
    botMessage?: string
    onClose: () => void
}

export function Toast({ type, message, botUsername, botMessage, onClose }: ToastProps) {
    const [show, setShow] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false)
            setTimeout(onClose, 300)
        }, 5000)

        return () => clearTimeout(timer)
    }, [onClose])

    const handleCopy = () => {
        if (botMessage) {
            navigator.clipboard.writeText(botMessage)
        }
    }

    const handleOpenBot = () => {
        if (botUsername) {
            window.open(`https://t.me/${botUsername.replace('@', '')}`, '_blank')
        }
    }

    if (!show) return null

    return (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg ${
            type === "success" ? "bg-green-500" :
                type === "error" ? "bg-red-500" :
                    "bg-blue-500"
        } text-white transition-all duration-300 transform ${show ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {type === "success" && <CheckCircle className="w-5 h-5" />}
                        <p className="font-medium">{message}</p>
                    </div>

                    {botUsername && (
                        <div className="mt-2 bg-black/20 p-2 rounded">
                            <p className="text-sm mb-2">{botMessage}</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={handleCopy}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={handleOpenBot}
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Open {botUsername}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => {
                        setShow(false)
                        onClose()
                    }}
                    className="ml-4 text-white hover:text-white/80"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}