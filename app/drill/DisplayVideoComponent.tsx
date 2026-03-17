"use client";

import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from "@mediapipe/tasks-vision";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  playbackVideoRef: React.RefObject<HTMLVideoElement | null>;
  
  isActive: boolean;
}


export default function DisplayVideoComponent() {


  return (
    <div>
      <div className="relative w-[640px] h-[480px] border border-zinc-800 bg-zinc-950 rounded-sm overflow-hidden">
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
            <p className="text-zinc-700 font-mono text-sm tracking-tighter">CAMERA_OFF // NO_SIGNAL</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          width="640"
          height="480"
        />
      </div>

      {playbackVideoRef.current && 
      <video
        ref={playbackVideoRef.current}
        autoPlay
        playsInline
        muted
        loop
        className="w-full h-full object-cover"
      />}
    </div>
  )
}