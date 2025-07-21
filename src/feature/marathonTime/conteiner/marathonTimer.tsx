"use client"

import {Layout} from "@/feature/marathonTime/conteiner/layout";
import {Timer} from "@/feature/marathonTime/ui/timer";
import {useEffect, useState} from "react";
import {Title} from "@/feature/marathonTime/ui/title";

export function MarathonTimer() {

    const [timeLeft, setTimeLeft] = useState({
        days: 8,
        hours: 8,
        minutes: 56,
        seconds: 22,
    })

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 }
                } else if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
                } else if (prev.hours > 0) {
                    return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
                } else if (prev.days > 0) {
                    return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
                }
                return prev
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    return (
        <Layout>
            <Title/>
            <Timer days={timeLeft.days} hours={timeLeft.hours} minutes={timeLeft.minutes} seconds={timeLeft.seconds}/>
        </Layout>
    )
}