"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import styles from "./styles.module.css";
import Image from "next/image";
import { useGame } from "@/shared/hooks/useGame";

type GameAreaProps = {
    resetBets: () => void;
    setGamePhase: (phase: string) => void;
    setCurrentMultiplier: (multiplier: number) => void;
    setRoundId: (id: number | null) => void;
};

export function GameArea({ resetBets, setGamePhase, setCurrentMultiplier, setRoundId }: GameAreaProps) {
    const { state } = useGame();

    useEffect(() => {
        setGamePhase(state.phase);
    }, [state.phase, setGamePhase]);

    useEffect(() => {
        setCurrentMultiplier(state.multiplier);
    }, [state.multiplier, setCurrentMultiplier]);

    useEffect(() => {
        setRoundId(state.roundId ?? null);
    }, [state.roundId, setRoundId]);

    useEffect(() => {
        if (state.phase === "crashed") {
            const id = setTimeout(() => resetBets(), 500);
            return () => clearTimeout(id);
        }
    }, [state.phase, resetBets]);

    const isActive = useMemo(() => state.phase !== "waiting" || state.multiplier > 1, [state.phase, state.multiplier]);

    const total = state.waitTotal || state.timeToStart || 0;
    const fillPercent = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - state.timeToStart) / total) * 100))) : 0;

    const trackRef = useRef<HTMLDivElement | null>(null);
    const [trackWidth, setTrackWidth] = useState(0);
    const [runnerPx, setRunnerPx] = useState(-80);
    const rafRef = useRef<number | null>(null);
    const animatedRoundRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isActive) return;
        const el = trackRef.current;
        if (!el) return;
        const measure = () => setTrackWidth(el.getBoundingClientRect().width);
        measure();
        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => measure());
            ro.observe(el);
        } else {
            const onResize = () => measure();
            window.addEventListener("resize", onResize);
            return () => window.removeEventListener("resize", onResize);
        }
        return () => ro && ro.disconnect();
    }, [isActive]);

    useEffect(() => {
        if (!isActive) setRunnerPx(-80);
    }, [isActive]);

    const animTo = (target: number, duration: number) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const start = performance.now();
        const from = runnerPx;
        const dx = target - from;
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            setRunnerPx(from + dx * ease(t));
            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
            }
        };
        rafRef.current = requestAnimationFrame(step);
    };

    useEffect(() => {
        if (state.phase !== "running" || trackWidth <= 0 || !state.roundId) return;
        if (animatedRoundRef.current === state.roundId) return;
        animatedRoundRef.current = state.roundId;
        setRunnerPx(-80);
        const center = trackWidth * 0.5;
        animTo(center, 650);
    }, [state.phase, state.roundId, trackWidth]);

    useEffect(() => {
        if (state.phase !== "crashed" || trackWidth <= 0) return;
        const offRight = trackWidth + 120;
        animTo(offRight, 700);
        animatedRoundRef.current = null;
    }, [state.phase, trackWidth]);

    useEffect(() => {
        if (rafRef.current) return () => cancelAnimationFrame(rafRef.current!);
    }, []);

    return (
        <Card
            style={{ height: "248px" }}
            className={`bg-[#150f27] border-[#984EED80] mb-4 text-white relative overflow-hidden ${isActive ? styles.background : ""}`}
        >
            <CardContent className="p-8 text-center flex flex-col items-center justify-center" style={{ paddingTop: 1 }}>
                {!isActive && (
                    <>
                        <div>
                            <Image src={"/rocket/rocket.png"} alt={"rocket"} width={50} height={50} className="w-16 h-16 mx-auto text-[#984eed] mb-4" />
                        </div>
                        <h2 className="text-xl font-bold">ОЖИДАНИЕ</h2>
                        <h3 className="text-lg mb-3">СЛЕДУЮЩЕГО РАУНДА</h3>
                        <div className="h-2 w-full bg-[#96969680] rounded overflow-hidden">
                            <div
                                style={{
                                    width: `${fillPercent}%`,
                                    height: "100%",
                                    backgroundColor: "#8845F5",
                                    transition: "width 250ms linear",
                                }}
                            />
                        </div>
                    </>
                )}
                {isActive && (
                    <div ref={trackRef} className="relative w-full mt-12" style={{ height: 128, minHeight: 128, marginBottom: 16 }}>
                        <div className="absolute left-0 w-full flex justify-center" style={{ top: 0, zIndex: 10, pointerEvents: "none" }}>
              <span className="text-2xl font-bold select-none" style={{ color: "#8845f5", borderRadius: 8, padding: "2px 16px" }}>
                x{state.multiplier.toFixed(2)}
                  {state.phase === "crashed" && (
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
                                pointerEvents: "none",
                            }}
                        >
                            <Image
                                src={"/rocket/begu.gif"}
                                alt="runner"
                                width={64}
                                height={64}
                                style={{ width: "64px", height: "64px", minWidth: "64px", minHeight: "64px", objectFit: "contain" }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
