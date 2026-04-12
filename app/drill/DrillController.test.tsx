import { render, act } from "@testing-library/react";
import { DrillController } from "./DrillController";
import * as settings from "./settings";
import * as footballUtils from "./footballDrillUtils";
import * as sprintUtils from "./sprintDrillUtils";

// 1. Mockujemy moduły narzędziowe
jest.mock("./Settings");
jest.mock("./footballDrillUtils");
jest.mock("./sprintDrillUtils");

jest.mock("./footballDrillUtils", () => ({
  // Pozwalamy rutynie być mockiem (do sprawdzania .toHaveBeenCalled)
  footballRoutine: jest.fn(),
  // Funkcja procesująca musi zwracać obiekt, żeby destructuring nie wywalił błędu
  process_football_landmarks: jest.fn((landmarks) => ({
    hipX: landmarks[0][0].x,
    groundWristY: landmarks[0][1].y,
    ankleY: landmarks[0][2].y
  }))
}));

jest.mock("./sprintDrillUtils", () => ({
  sprintRoutine: jest.fn(),
  process_sprint_landmarks: jest.fn((landmarks) => ({
    hipX: landmarks[0][0].x,
    groundWristY: landmarks[0][1].y,
    ankleY: landmarks[0][2].y
  }))
}));

// 2. Mockujemy requestAnimationFrame (JSDOM go nie posiada)
global.requestAnimationFrame = (callback: FrameRequestCallback) => 
  setTimeout(() => callback(Date.now()), 16) as any;
global.cancelAnimationFrame = (id: any) => clearTimeout(id);

describe("DrillController Integration Tests", () => {
  const mockStartRecording = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("powinien odpalić sprintRoutine, gdy mode to SPRINT i gracz wejdzie w pozycję", async () => {
    // GIVEN: Tryb SPRINT
    (settings.getMode as jest.Mock).mockReturnValue("SPRINT");
    
    // Dane symulujące gracza w niskiej pozycji (wrist blisko ankle)
    const mockLandmarksRef = { 
      current: [[
        { x: 0.5, y: 0.8, z: 0.1 }, // hip (idx 0 w uproszczeniu Twoich utilsów)
        { x: 0.5, y: 0.9, z: 0.1 }, // wrist
        { x: 0.5, y: 0.95, z: 0.1 } // ankle
      ]] as any
    };

    // WHEN: Renderujemy komponent
    render(
      <DrillController 
        landmarksRef={mockLandmarksRef} 
        startRecordingCommandRef={{ current: mockStartRecording }} 
      />
    );

    // KROK KLUCZOWY: Popychamy czas, aby pętla loop (RAF) wykonała przynajmniej jeden obieg
    await act(async () => {
      jest.advanceTimersByTime(32); // Dwie klatki dla pewności
    });

    // THEN: Powinna zostać zawołana rutyna sprinterska
    expect(sprintUtils.sprintRoutine).toHaveBeenCalled();
    expect(footballUtils.footballRoutine).not.toHaveBeenCalled();
  });

  it("powinien odpalić footballRoutine, gdy mode to DLINE i gracz wejdzie w pozycję", async () => {
    // GIVEN: Tryb DLINE
    (settings.getMode as jest.Mock).mockReturnValue("DLINE");
    
    const mockLandmarksRef = { 
      current: [[
        { x: 0.5, y: 0.8, z: 0.1 }, 
        { x: 0.5, y: 0.9, z: 0.1 }, 
        { x: 0.5, y: 0.95, z: 0.1 }
      ]] as any
    };

    // WHEN: Renderujemy komponent
    render(
      <DrillController 
        landmarksRef={mockLandmarksRef} 
        startRecordingCommandRef={{ current: mockStartRecording }} 
      />
    );

    // KROK KLUCZOWY: Popychamy czas
    await act(async () => {
      jest.advanceTimersByTime(32);
    });

    // THEN: Powinna zostać zawołana rutyna futbolowa
    expect(footballUtils.footballRoutine).toHaveBeenCalled();
    expect(sprintUtils.sprintRoutine).not.toHaveBeenCalled();
  });

  // Test pomocniczy: sprawdzenie czy nie odpala startu, gdy gracz stoi (wrist daleko od ankle)
  it("nie powinien odpalać żadnej rutyny, gdy gracz stoi", async () => {
    (settings.getMode as jest.Mock).mockReturnValue("SPRINT");
    
    const mockLandmarksRef = { 
      current: [[
        { x: 0.5, y: 0.5, z: 0.1 }, // hip
        { x: 0.5, y: 0.5, z: 0.1 }, // wrist (wysoko)
        { x: 0.5, y: 0.9, z: 0.1 }  // ankle (nisko) -> diff > 0.1
      ]] as any
    };

    render(
      <DrillController 
        landmarksRef={mockLandmarksRef} 
        startRecordingCommandRef={{ current: mockStartRecording }} 
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(32);
    });

    expect(sprintUtils.sprintRoutine).not.toHaveBeenCalled();
    expect(footballUtils.footballRoutine).not.toHaveBeenCalled();
  });
});