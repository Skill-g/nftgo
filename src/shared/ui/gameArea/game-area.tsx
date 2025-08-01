"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import styles from './styles.module.css'
import Image from "next/image";

type GameAreaProps = {
    resetBets: () => void;
    setGamePhase: (phase: string) => void;
    setCurrentMultiplier: (multiplier: number) => void;
};

export function GameArea({
                             resetBets,
                             setGamePhase,
                             setCurrentMultiplier,
                         }: GameAreaProps) {
    const [phase, setPhase] = useState<"waiting" | "running" | "crashed">("waiting");
    const [progress, setProgress] = useState(0);
    const trackRef = useRef<HTMLDivElement | null>(null); // ✅ фикс offsetWidth
    const [trackWidth, setTrackWidth] = useState(0);

    const [multiplier, setMultiplier] = useState(1);
    const [crashPoint, setCrashPoint] = useState(0);

    const [startTime, setStartTime] = useState(0);
    const [runnerPx, setRunnerPx] = useState(0);
    const [, setEscapeStart] = useState<number | null>(null);

    function updateWidth() {
        if (trackRef.current) {
            setTrackWidth(trackRef.current.offsetWidth);
        }
    }

    useEffect(() => {
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        if (phase === "running" || phase === "crashed") {
            setTimeout(updateWidth, 0);
        }
    }, [phase]);

    useEffect(() => {
        setGamePhase?.(phase);
    }, [phase, setGamePhase]);

    useEffect(() => {
        setCurrentMultiplier?.(multiplier);
    }, [multiplier, setCurrentMultiplier]);

    useEffect(() => {
        if (phase === "waiting") {
            setEscapeStart(null);
            setRunnerPx(0);
            setProgress(0);
            let value = 0;

            const interval = setInterval(() => {
                value += 1;
                setProgress(value);
                if (value >= 100) {
                    clearInterval(interval);
                    const newCrash = +(Math.random() * 4 + 1).toFixed(2);
                    setCrashPoint(newCrash);
                    setPhase("running");
                    setMultiplier(1);
                    setStartTime(Date.now());
                }
            }, 20);

            return () => clearInterval(interval);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === "running" && trackWidth > 0) {
            let stopped = false;
            const RUNNER_TRACK_END = 0.9;
            const DURATION = 6;
            const targetPx = trackWidth * RUNNER_TRACK_END;

            function animate() {
                if (stopped) return;
                const elapsed = (Date.now() - startTime) / 1000;
                const px = Math.min((elapsed / DURATION) * targetPx, targetPx);
                setRunnerPx(px);

                const newMultiplier = +(1 + elapsed * 1.2).toFixed(2);
                setMultiplier(newMultiplier);

                if (newMultiplier >= crashPoint) {
                    setPhase("crashed");
                } else {
                    requestAnimationFrame(animate);
                }
            }

            animate();
            return () => {
                stopped = true;
            };
        }
    }, [phase, crashPoint, startTime, trackWidth]);

    useEffect(() => {
        if (phase === "crashed" && trackWidth > 0) {
            setEscapeStart(Date.now());
            let stopped = false;
            const ESCAPE_SPEED = trackWidth * 1.2;
            let px = runnerPx;
            let lastTime = Date.now();

            function escape() {
                if (stopped) return;
                const now = Date.now();
                const dt = (now - lastTime) / 1000;
                lastTime = now;
                px += ESCAPE_SPEED * dt;
                setRunnerPx(px);

                if (px < trackWidth * 1.3) {
                    requestAnimationFrame(escape);
                }
            }

            escape();

            const timeout = setTimeout(() => {
                setPhase("waiting");
                resetBets();
                setRunnerPx(0);
                setEscapeStart(null);
            }, 900);

            return () => {
                stopped = true;
                clearTimeout(timeout);
            };
        }
    }, [phase, trackWidth, runnerPx, resetBets]);

    return (
        <Card
            style={{ height: "248px" }}
            className={`bg-[#150f27] border-[#984EED80] mb-4 text-white relative overflow-hidden ${(phase === "running" || phase === "crashed") ? styles.background : ""}`}
        >
            <CardContent
                className="p-8 text-center flex flex-col items-center justify-center"
                style={{ paddingTop: 1 }}
            >
                {phase === "waiting" && (
                    <>
                        <div>
                            <Image
                                src={"/rocket/rocket.png"}
                                alt={"rocket"}
                                width={50}
                                height={50}
                                className="w-16 h-16 mx-auto text-[#984eed] mb-4"
                            />
                        </div>
                        <h2 className="text-xl font-bold">ОЖИДАНИЕ</h2>
                        <h3 className="text-lg mb-6">СЛЕДУЮЩЕГО РАУНДА</h3>
                        <Progress value={progress} className="h-2 bg-[#96969680]" />
                    </>
                )}
                {(phase === "running" || phase === "crashed") && (
                    <div
                        ref={trackRef}
                        className={`relative w-full mt-12`}
                        style={{ height: 128, minHeight: 128, marginBottom: 16 }}
                    >
                        <div
                            className="absolute left-0 w-full flex justify-center"
                            style={{ top: 0, zIndex: 10, pointerEvents: "none" }}
                        >
                            <span
                                className="text-2xl font-bold select-none"
                                style={{
                                    color: "#8845f5",
                                    borderRadius: 8,
                                    padding: "2px 16px",
                                }}
                            >
                                x{multiplier.toFixed(2)}
                                {phase === "crashed" && (
                                    <span className="mt-2 text-white">
                                        <br />
                                        УБЕЖАЛ
                                    </span>
                                )}
                            </span>
                        </div>
                        <div
                            className="absolute"
                            style={{
                                left: `${runnerPx}px`,
                                bottom: 0,
                                width: "64px",
                                height: "64px",
                                transform: "translate(-50%,0%)",
                                transition: "left 0.05s linear",
                                pointerEvents: "none",
                            }}
                        >
                            <Image
                                src={"/rocket/begu.gif"}
                                alt="runner"
                                width={64}
                                height={64}
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    minWidth: "64px",
                                    minHeight: "64px",
                                    objectFit: "contain",
                                }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
