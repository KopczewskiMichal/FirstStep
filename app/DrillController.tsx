"use client";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useState, useEffect, useRef } from "react";

export const DrillController = ({ landmarksRef, isActive }: { landmarksRef: React.RefObject<NormalizedLandmark[][] | null>, isActive: boolean }) => {
  const [phase, setPhase] = useState<"IDLE" | "SET" | "GO">("IDLE");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  
  const baselineX = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const rafId = useRef<number>(0);

  const loop = () => {
    const landmarks = landmarksRef.current
    if (!landmarks || !landmarks[0] || !isActive) {
      rafId.current = requestAnimationFrame(loop);
      return;
    }

    const player = landmarks[0];
    const centerOnLeft = player[23].z > player[24].z;
    const hipX = centerOnLeft ? player[23].x : player[24].x;
    const groundWristY = centerOnLeft ? player[15].y : player[16].y;
    const ankleY = player[28].y;

    const ankleWristYDiff = Math.abs(ankleY - groundWristY);
    if (phase === "IDLE" && ankleWristYDiff < 0.1) {
      startDrill();
    }

    if (phase === "GO" && baselineX.current !== null) {
      const movement = Math.abs(hipX - baselineX.current);
      if (movement > 0.05) { 
        const endTime = performance.now();
        setReactionTime(Math.round(endTime - startTime.current));
        setPhase("IDLE")
      }
    } else if (phase === "SET") {
      baselineX.current = hipX
    }

    rafId.current = requestAnimationFrame(loop);
  };

  const startDrill = () => {
    setPhase("SET");
    setReactionTime(null);
  
    const hatDelay = 2000;
    const randomDelay = Math.random() * 3000;

    setTimeout(() => {
      setPhase("GO");
      startTime.current = performance.now();
    }, hatDelay + randomDelay);
  };

  useEffect(() => {
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current!);
  }, [isActive, phase]); 

  return (
    <div className={`mt-8 p-6 rounded-xl border-4 transition-all ${
      phase === "GO" ? "border-green-500 bg-green-900/20" : 
      phase === "SET" ? "border-yellow-500 bg-yellow-900/20" : "border-zinc-800"
    }`}>
      <div className="text-center font-mono">
         {phase === "IDLE" && <p className="...">Set up in stance to start</p>}
         {phase === "SET" && <p className="...">DOWN!</p>}
         {phase === "GO" && <p className="...">HAT!</p>}
         {reactionTime && <p className="text-blue-400 text-6xl">{reactionTime}ms</p>}
      </div>
      {phase === "IDLE" && <button className="text-lime-200" onClick={() => {startDrill(), setTimeout(()=>{setReactionTime(100), setPhase("IDLE")}, 5000)}}>Mock Start Drill</button>}
    </div>
  );
};