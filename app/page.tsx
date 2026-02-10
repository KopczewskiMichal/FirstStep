"use client";

import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { log } from "console";

export default function PosePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null); 
  const [fps, setFps] = useState(0);
  const lastFrameTimeRef = useRef<number>(0);
  
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isActive, setIsActive] = useState(false); // Domyślnie wyłączone

  useEffect(() => {
    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const instance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      setLandmarker(instance);
    }
    init();
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startProgram() {
      if (!landmarker) return;

      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          requestRef.current = requestAnimationFrame(predictLoop);
        };
      }
    }

    function stopProgram() {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      const ctx = canvasRef.current?.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
    }

    if (isActive) {
      startProgram();
    } else {
      stopProgram();
    }

    return () => stopProgram(); 
  }, [isActive, landmarker]);

const predictLoop = () => {
  const now = performance.now();
  
  if (lastFrameTimeRef.current !== 0) {
    const delta = now - lastFrameTimeRef.current;
    const currentFps = 1000 / delta;
    
    if (Math.random() > 0.9) {
      setFps(Math.round(currentFps));
    }
  }
  
  lastFrameTimeRef.current = now;


  if (landmarker && videoRef.current && videoRef.current.readyState >= 2) {
    const results = landmarker.detectForVideo(videoRef.current, now);
    const ctx = canvasRef.current?.getContext("2d");

    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(ctx);
        for (const landmark of results.landmarks) {
          drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
          drawingUtils.drawLandmarks(landmark, { radius: 2 });
        }
      }
    }
  }

  if (isActive) {
    requestRef.current = requestAnimationFrame(predictLoop);
  }
};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-xl font-mono mb-6 tracking-widest text-zinc-500 uppercase">
        System Status: <span className={isActive ? "text-green-500" : "text-red-500"}>
          {isActive ? "Live" : "Standby"}
        </span>
      </h1>

      {isActive && (
        <p>{fps}</p>
      )}

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

      <button
        onClick={() => setIsActive(!isActive)}
        disabled={!landmarker}
        className={`mt-10 px-12 py-4 font-mono text-sm border transition-all duration-300 ${
          isActive 
            ? "border-red-900 text-red-500 hover:bg-red-950" 
            : "border-green-900 text-green-500 hover:bg-green-950"
        } disabled:opacity-20`}
      >
        {isActive ? "[ STOP_SESSION ]" : "[ START_SESSION ]"}
      </button>

      {!landmarker && <p className="mt-4 animate-pulse text-xs text-zinc-600">Booting AI models...</p>}
    </div>
  );
}