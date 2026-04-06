import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { getPreSnapTimeLimits } from "./Settings";

export function process_football_landmarks(landmarks: NormalizedLandmark[][]) {
  const player = landmarks[0];
  const centerOnLeft = player[23].z > player[24].z;
  const hipX = centerOnLeft ? player[23].x : player[24].x;
  const groundWristY = centerOnLeft ? player[15].y : player[16].y;
  const ankleY = player[28].y;
  return { hipX, groundWristY, ankleY };
}

export function preSnapFootballRoutine():number{
  const preSnapTime = getPreSnapTimeLimits();
  return preSnapTime[0] + (Math.random() * preSnapTime[1] - preSnapTime[0]);
}