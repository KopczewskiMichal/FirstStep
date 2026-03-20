"use client";

import { use, useEffect, useRef, useState } from "react";


interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  playbackVideoRef: React.RefObject<HTMLVideoElement | null>;
  playbackVideoUrl: string | null;
  isActive: boolean;
}


export default function DisplayVideoComponent({ videoRef, canvasRef, playbackVideoRef, playbackVideoUrl: currentPlaybackUrl, isActive }: Props) {

  useEffect(() => {
    console.log(currentPlaybackUrl)
    console.log(playbackVideoRef.current === null ? "Nie mam powtórki video" : "Jak Kaczyński, wiem ale nie powiem, a może jednak?");

  }, [currentPlaybackUrl]);

  const hasPlayback = !!currentPlaybackUrl;

  return (
    <div className="relative w-full max-w-6xl mx-auto aspect-video bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">


      {hasPlayback && (
        <video
          ref={playbackVideoRef}
          key={currentPlaybackUrl}
          src={currentPlaybackUrl}
          autoPlay
          playsInline
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover z-0 -scale-x-100"

          onLoadedMetadata={() => {
            if (playbackVideoRef.current) {
              // 0.5 = 50% prędkości (idealne do analizy pad level)
              // 1.0 = normalna prędkość
              // 2.0 = 2x szybciej
              playbackVideoRef.current.playbackRate = 0.5;
            }
          }}
        />
      )}

      {/* 2. KAMERA LIVE + CANVAS (Na pełnym ekranie LUB w prawym dolnym rogu) */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${hasPlayback
            ? "absolute bottom-6 right-6 w-72 aspect-video z-50 rounded-xl border-2 border-zinc-700 shadow-2xl" // Tryb PiP (Picture-in-Picture)
            : "absolute inset-0 w-full h-full z-10" // Tryb Pełnoekranowy
          }`}
      >
        {/* Brak sygnału */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/90 backdrop-blur-sm">
            <p className="text-zinc-600 font-mono text-sm tracking-widest">CAMERA_OFF // NO_SIGNAL</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Canvas musi mieć w CSS w-full i h-full, żeby skalował się razem z wideo do prawego dolnego rogu */}
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-10"
        />
      </div>

    </div>
  );
}