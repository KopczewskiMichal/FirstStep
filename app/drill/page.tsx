"use client";

import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { DrillController } from "./DlineDrillComponent";
import { getRecordingDuration, initSettings } from "./Settings";


const drawMirroredFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  return canvas;
};

export default function DrillPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const landmarksRef = useRef<NormalizedLandmark[][] | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isActive, setIsActive] = useState(false);

  initSettings();

  useEffect(() => {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      offscreenCanvasRef.current = canvas;
    }
  }, []);

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

      // stream = await navigator.mediaDevices.getUserMedia({
      //   video: {
      //     width: { ideal: 640 },
      //     height: { ideal: 480 },
      //     frameRate: { ideal: 30, max: 40 },
      //     facingMode: "user"
      //   }
      // });

      // W miejscu gdzie normalnie robisz navigator.mediaDevices.getUserMedia
      const mockCamera = () => {
        const video = document.createElement('video');
        video.src = "/video.mp4"; // Wrzuć plik do folderu public
        video.loop = true;
        video.muted = true; // Musi być wyciszony, żeby przeglądarka pozwoliła na play()
        video.play();

        const stream = (video as any).captureStream ? (video as any).captureStream(30) : (video as any).mozCaptureStream(60);

        return stream as MediaStream;
      };

      const stream = process.env.NODE_ENV === "development" ? mockCamera() : await navigator.mediaDevices.getUserMedia({ video: true });


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

      const ctx = canvasRef.current?.getContext("2d", { alpha: false });
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
      // if (Math.random() > 0.9) setFps(Math.round(1000 / delta));
    }
    lastFrameTimeRef.current = now;

    const video = videoRef.current;
    const offCanvas = offscreenCanvasRef.current;
    const visibleCanvas = canvasRef.current;

    if (landmarker && video && video.readyState >= 2 && offCanvas && visibleCanvas) {
      const offCtx = offCanvas.getContext("2d");
      const visibleCtx = visibleCanvas.getContext("2d", { alpha: false });

      if (offCtx && visibleCtx) {
        const mirroredFrame = drawMirroredFrame(video, offCanvas, offCtx);

        const results = landmarker.detectForVideo(mirroredFrame, now);

        visibleCtx.drawImage(mirroredFrame, 0, 0, visibleCanvas.width, visibleCanvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          landmarksRef.current = results.landmarks
          const drawingUtils = new DrawingUtils(visibleCtx);
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




  // const handleStartRecording = (stream: MediaStream | null, durationMs: number = 3000) => {
  const handleStartRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) {
      console.error("Brak streamu do nagrania!");
      return;
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorderRef.current = recorder;
    chunksRef.current = []; // Resetujemy stare dane

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      if (process.env.NODE_ENV === "development") {
        const a = document.createElement('a');
        a.href = url;
        a.download = `drill_${Date.now()}.webm`;
        a.click();
        console.log("Nagranie gotowe i pobrane!");
      }
    };

    recorder.start();
    console.log("Nagrywanie rozpoczęte...");

    setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
        console.log("Nagrywanie zakończone automatycznie.");
      }
    }, getRecordingDuration());
  };

  const startRecordingRef = useRef(handleStartRecording);

  // Zawsze aktualizujem refa, żeby widział najświeższy scope rodzica
  useEffect(() => {
    startRecordingRef.current = handleStartRecording;
    console.log("Bezsensowne odświeżenie rodzica")
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-xl font-mono mb-6 tracking-widest text-zinc-500 uppercase">
        System Status: <span className={isActive ? "text-green-500" : "text-red-500"}>
          {isActive ? "Live" : "Standby"}
        </span>
      </h1>

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

      {isActive && (<DrillController landmarksRef={landmarksRef} startRecordingCommandRef={startRecordingRef} />)}

      <button
        onClick={() => setIsActive(!isActive)}
        disabled={!landmarker}
        className={`mt-10 px-12 py-4 font-mono text-sm border transition-all duration-300 ${isActive
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