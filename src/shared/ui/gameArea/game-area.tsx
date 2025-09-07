"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import styles from "./styles.module.css";
import Image from "next/image";
import { useGame } from "@/shared/hooks/useGame";
import { motion, AnimatePresence } from "framer-motion";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CRUSH === "1";

type GameAreaProps = {
    resetBets: () => void;
    setGamePhase: (phase: string) => void;
    setCurrentMultiplier: (multiplier: number) => void;
    setRoundId: (id: number | null) => void;
};

function useCountdown(sourceTimeToStart?: number | null) {
    const [now, setNow] = useState(() => Date.now());
    const endRef = useRef<number | null>(null);
    useEffect(() => {
        if (sourceTimeToStart == null) {
            endRef.current = null;
            return;
        }
        const ms = sourceTimeToStart > 1000 ? sourceTimeToStart : sourceTimeToStart * 1000;
        endRef.current = Date.now() + ms;
        setNow(Date.now());
    }, [sourceTimeToStart]);
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(id);
    }, []);
    const remainingMs = Math.max(0, (endRef.current ?? Date.now()) - now);
    const remainingSec = Math.ceil(remainingMs / 1000);
    return remainingSec;
}

function useMockSeconds(enabled: boolean, initial = 12) {
    const [remaining, setRemaining] = useState(initial);
    useEffect(() => {
        if (!enabled) return;
        setRemaining(initial);
        const id = setInterval(() => {
            setRemaining((v) => (v <= 1 ? initial : v - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [enabled, initial]);
    return remaining;
}

function Digit({ value, idx, tickKey }: { value: string; idx: number; tickKey: number }) {
    return (
        <span className="relative inline-block w-[0.7em] h-[1em] overflow-hidden align-baseline">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
            key={`${idx}-${value}-${tickKey}`}
            initial={{ y: "0.8em", opacity: 0, scale: 0.7, filter: "blur(6px)" }}
            animate={{ y: "0em", opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ y: "-0.8em", opacity: 0, scale: 1.15, filter: "blur(6px)" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="text-6xl md:text-7xl font-extrabold"
            style={{ display: "inline-block", lineHeight: 1, color: "#8845f5" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
    );
}

function AnimatedSeconds({ seconds }: { seconds: number }) {
    const text = String(seconds);
    return (
        <div className="mt-2 flex items-center justify-center gap-[0.02em] select-none" style={{ fontVariantNumeric: "tabular-nums" }}>
            {text.split("").map((ch, i) => (
                <Digit key={`d-${i}`} value={ch} idx={i} tickKey={seconds} />
            ))}
        </div>
    );
}

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

    const isActiveReal = useMemo(() => state.phase !== "waiting" || state.multiplier > 1, [state.phase, state.multiplier]);
    const isActive = USE_MOCK ? false : isActiveReal;

    const remainingReal = useCountdown(state.timeToStart ?? 0);
    const remainingMock = useMockSeconds(USE_MOCK, 12);
    const remainingSec = USE_MOCK ? remainingMock : remainingReal;

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
                        <h3 className="text-lg mb-2">СЛЕДУЮЩЕГО РАУНДА</h3>
                        <AnimatedSeconds seconds={remainingSec} />
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
