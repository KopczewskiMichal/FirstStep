"use client";
import { useState, useEffect, useRef } from "react";

interface Props {
  landmarks: any; 
  isActive: boolean;
}

export const DrillController = ({ landmarks, isActive }: Props) => {
  const [phase, setPhase] = useState<"IDLE" | "SET" | "GO" | "FINISHED">("IDLE");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  
  const baselineX = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  const hat_delay = 2000

  useEffect(() => {
    if (!landmarks || !landmarks[0]) return;

    const closer_side_left = landmarks[0][11].z > landmarks[0][12].z // Z dodatnie oznacza że coś jest bliżej od strony przeciwnej.
    const hipX = closer_side_left ? landmarks[0][23].x : landmarks[0][24]; // Uzywamy bliższego biodra

    if (phase === "SET" && baselineX.current === null) {
      baselineX.current = hipX;
    }

    if (phase === "GO" && baselineX.current !== null) {
      const movement = Math.abs(hipX - baselineX.current);
      if (movement > 0.2) { 
        setReactionTime(Math.round(performance.now() - startTime.current));
        setPhase("FINISHED");
      }
    }
  }, [landmarks, phase]);

  const startDrill = () => {
    setPhase("SET");
    setReactionTime(null);
    baselineX.current = null;

    const set_to_start_delay = hat_delay + Math.random() * 5000;
    setTimeout(() => {
      setPhase("GO");
      startTime.current = performance.now();
    }, set_to_start_delay);
  };

  return (
    <div className={`mt-8 p-6 rounded-xl border-4 transition-all ${
      phase === "GO" ? "border-green-500 bg-green-900/20" : 
      phase === "SET" ? "border-yellow-500 bg-yellow-900/20" : "border-zinc-800"
    }`}>
      <div className="text-center font-mono">
        {phase === "IDLE" && <p className="text-zinc-500 text-sm">Zajmij pozycję i kliknij START</p>}
        {phase === "SET" && <p className="text-yellow-500 text-2xl animate-pulse font-bold uppercase">Ready... SET...</p>}
        {phase === "GO" && <p className="text-green-500 text-5xl font-black italic">HIT IT!</p>}
        {phase === "FINISHED" && (
          <div className="animate-bounce">
            <p className="text-white text-sm uppercase">Reaction Time</p>
            <p className="text-blue-400 text-6xl font-black">{reactionTime}ms</p>
          </div>
        )}
      </div>

      <button
        onClick={startDrill}
        className="mt-6 w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
      >
        {phase === "FINISHED" ? "TRY AGAIN" : "START DRILL"}
      </button>
    </div>
  );
};