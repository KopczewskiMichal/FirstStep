"use client";

import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { DrillController } from "./DrillController";
import { getMode, getRecordingDuration, initSettings } from "./settings";
import DisplayVideoComponent from "./DisplayVideoComponent";
import HelpComponent from "./HelpComponent";
import SettingsComponent from "./SettingsComponent";


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
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);

  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [playbackVideoUrl, setPlaybackUrl] = useState<string | null>(null);
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);


  useEffect(() => {
    initSettings();
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      offscreenCanvasRef.current = canvas;
    }
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
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 40 },
          facingMode: "user"
        }
      });

      // W miejscu gdzie normalnie robisz navigator.mediaDevices.getUserMedia
      // const mockCamera = () => {
      //   const video = document.createElement('video');
      //   video.src = "/video.mp4"; 
      //   video.loop = true;
      //   video.muted = true; // Musi być wyciszony, żeby przeglądarka pozwoliła na play()
      //   video.play();

      //   const stream = (video as any).captureStream ? (video as any).captureStream(30) : (video as any).mozCaptureStream(60);

      //   return stream as MediaStream;
      // };
      // const stream = process.env.NODE_ENV === "development" ? mockCamera() : await navigator.mediaDevices.getUserMedia({ video: true });


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


  const handleStartRecording = () => {
    const durationMs = getRecordingDuration();
    const stream = videoRef.current?.srcObject as MediaStream | null;

    if (!stream) {
      console.error("No stream available for recording.");
      return;
    } else if (durationMs === 0) return;

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const newUrl = URL.createObjectURL(blob);

      // Trik: Sprzątamy RAM bezpośrednio w callbacku stanu, 
      // więc nie potrzebujemy żadnego starego wideo ani refów.
      setPlaybackUrl((prevUrl) => {
        if (prevUrl && prevUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prevUrl);
        }
        return newUrl;
      });

      chunksRef.current = [];
    };

    recorder.start();
    console.log("Recording started...");

    setTimeout(() => {
      if (recorder.state !== "inactive") {
        recorder.stop();
        console.log("Recording completed automatically.");
      }
    }, durationMs); // <-- Dałem tu Twoją zmienną zamiast wywoływać funkcję 2x
  };

  const startRecordingRef = useRef(handleStartRecording);

  useEffect(() => {
    startRecordingRef.current = handleStartRecording;
  });

  const toggleHelp = () => {
    setShowHelpInfo(!showHelpInfo);
    if (!showHelpInfo) setShowSettings(false);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (!showSettings) setShowHelpInfo(false);
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen overflow-hidden bg-black text-white p-4">

      {/* SETTINGS */}
      <div className="absolute top-2 left-2 z-40">
        <button
          aria-label="Settings"
          onClick={toggleSettings}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
        >
          ⚙️
        </button>
        {showSettings && <SettingsComponent onClose={() => setShowSettings(false)} />}
      </div>

      {/* HELP */}
      <div className="absolute top-2 right-2 z-40">
        <button
          aria-label="Help" 
          onClick={toggleHelp}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
        >
          ?
        </button>
        {showHelpInfo && <HelpComponent onClose={() => setShowHelpInfo(false)} />}
      </div>



      {/* 1. KONTENER NA WIDEO (Zostaje bez zmian - elastyczny) */}
      <div className="flex-1 w-full max-w-7xl flex flex-col items-center justify-center min-h-0">
        <DisplayVideoComponent
          videoRef={videoRef}
          canvasRef={canvasRef}
          playbackVideoRef={playbackVideoRef}
          playbackVideoUrl={playbackVideoUrl}
          isActive={isActive}
        />
      </div>

      <div className="shrink-0 h-32 flex flex-col items-center justify-center relative w-full mt-4">

        <div className="flex flex-row items-center justify-center gap-8 w-full">

          <button
            onClick={() => setIsActive(!isActive)}
            disabled={!landmarker}
            className={`px-12 py-4 font-mono text-sm border transition-all duration-300 ${isActive
              ? "border-red-900 text-red-500 hover:bg-red-950"
              : "border-green-900 text-green-500 hover:bg-green-950"
              } disabled:opacity-20`}
          >
            {isActive ? "[ STOP_SESSION ]" : "[ START_SESSION ]"}
          </button>

          {isActive && (
            <div className="flex items-center justify-center min-w-[200px] transform scale-125 origin-left transition-all">
              <DrillController
                landmarksRef={landmarksRef}
                startRecordingCommandRef={startRecordingRef}
              />
            </div>
          )}

        </div>

        {!landmarker && (
          <p className="absolute -bottom-2 animate-pulse text-xs text-zinc-600">
            Booting AI models...
          </p>
        )}
      </div>
    </div>
  );
}