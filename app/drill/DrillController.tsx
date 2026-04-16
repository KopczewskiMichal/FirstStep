"use client";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useState, useEffect, useRef } from "react";
import { getMode} from "./settings";
import { footballRoutine, process_football_landmarks } from "./footballDrillUtils";
import { process_sprint_landmarks, sprintRoutine } from "./sprintDrillUtils";

interface Props {
  landmarksRef: React.RefObject<NormalizedLandmark[][] | null>;
  startRecordingCommandRef: React.RefObject<() => void>;
}

export const DRILL_STRATEGIES = {
  DLINE: (onGo: () => void) => {
    footballRoutine(onGo);
  },
  SPRINT: (onGo: () => void) => {
    sprintRoutine(onGo); 
  }
};

export const DrillController = ({
  landmarksRef,
  startRecordingCommandRef
}: Props) => {
  const [phase, setPhase] = useState<"IDLE" | "SET" | "GO">("IDLE");
  const [reactionTime, setReactionTime] = useState<number | null>(null);

  const baselineX = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const rafId = useRef<number>(0);


  const loop = () => {
    const landmarks = landmarksRef.current
    if (!landmarks || !landmarks[0]) {
      rafId.current = requestAnimationFrame(loop);
      return;
    }

    let hipX, groundWristY, ankleY;
    switch (getMode()) {
      case "DLINE":
        ({ hipX, groundWristY, ankleY } = process_football_landmarks(landmarks));
        break;
      case "SPRINT":
        ({ hipX, groundWristY, ankleY } = process_sprint_landmarks(landmarks));
        break;
    }

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
    const mode = getMode();
    
    setPhase("SET");
    setReactionTime(null);

    DRILL_STRATEGIES[mode](() => {
      setPhase("GO");
      startTime.current = performance.now();
      startRecordingCommandRef.current();
    });
  };


  useEffect(() => {
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current!);
  }, [phase]);

  return (
    <div className={`mt-8 p-6 rounded-xl border-4 transition-all ${phase === "GO" ? "border-green-500 bg-green-900/20" :
      phase === "SET" ? "border-yellow-500 bg-yellow-900/20" : "border-zinc-800"
      }`}>
      <div className="text-center font-mono">
        {phase === "IDLE" && <p className="...">Set up in stance to start</p>}
        {phase === "SET" && <p className="...">DOWN!</p>}
        {phase === "GO" && <p className="...">HAT!</p>}
        {reactionTime && <p className="text-blue-400 text-6xl">{reactionTime}ms</p>}
      </div>
      {(phase === "IDLE" && process.env.NODE_ENV === 'development') && <button className="text-lime-200" onClick={() => { startDrill(); setTimeout(() => { setReactionTime(99); setPhase("IDLE") }, 6500); }}>Mock Start Drill</button>}
    </div>
  );
};