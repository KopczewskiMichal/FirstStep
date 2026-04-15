import { render, act, screen, fireEvent } from "@testing-library/react";
import { DRILL_STRATEGIES, DrillController } from "./DrillController";
import * as settings from "./settings";
import * as footballUtils from "./footballDrillUtils";
import * as sprintUtils from "./sprintDrillUtils";

// 1. Mockujemy moduły narzędziowe
jest.mock("./settings");
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

it("powinien przełączyć się na sprint, gdy getMode zacznie zwracać SPRINT", async () => {
  // 1. GIVEN: Zaczynamy jako DLINE
  (settings.getMode as jest.Mock).mockReturnValue("DLINE");
  
  const mockLandmarksRef = { 
    current: [[
      { x: 0.5, y: 0.8, z: 0.1 }, 
      { x: 0.5, y: 0.9, z: 0.1 }, 
      { x: 0.5, y: 0.95, z: 0.1 }
    ]] as any
  };

  render(
    <DrillController 
      landmarksRef={mockLandmarksRef} 
      startRecordingCommandRef={{ current: mockStartRecording }} 
    />
  );

  // Popychamy czas, żeby pętla ruszyła jako Football
  await act(async () => {
    jest.advanceTimersByTime(32);
  });
  expect(footballUtils.process_football_landmarks).toHaveBeenCalled();
  
  // RESETUJEMY MOCKI (ale nie implementację!)
  jest.clearAllMocks();

  // 2. WHEN: Zmieniamy zwracaną wartość przez funkcję
  (settings.getMode as jest.Mock).mockReturnValue("SPRINT");

  // 3. THEN: Popychamy czas o kolejną klatkę (lub dwie dla pewności)
  await act(async () => {
    jest.advanceTimersByTime(64); // Dajemy mu 2 klatki na "załapanie"
  });

  // Teraz musi zawołać sprint, bo w pętli loop jest switch(getMode())
  expect(sprintUtils.process_sprint_landmarks).toHaveBeenCalled();
  expect(footballUtils.process_football_landmarks).not.toHaveBeenCalled();
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

it("powinien obliczyć reactionTime po wykryciu ruchu w fazie GO", async () => {
  let triggerGo: () => void = () => {};
  const sprintSpy = jest.spyOn(DRILL_STRATEGIES, 'SPRINT').mockImplementation((callback) => {
    triggerGo = callback;
  });

  (settings.getMode as jest.Mock).mockReturnValue("SPRINT");
  const mockLandmarksRef = { 
    current: [[
        { x: 0.5, y: 0.8, z: 0.1 }, // hip
        { x: 0.5, y: 0.9, z: 0.1 }, // wrist
        { x: 0.5, y: 0.95, z: 0.1 } // ankle
    ]] as any 
  };

  render(<DrillController landmarksRef={mockLandmarksRef} startRecordingCommandRef={{ current: jest.fn() }} />);

  // 1. Wykrycie pozycji -> komponent odpala startDrill() i przechodzi w stan "SET"
  await act(async () => {
    jest.advanceTimersByTime(32);
  });

  // ---> TUTAJ BYŁ BŁĄD! <---
  // Musimy poczekać 1 klatkę BĘDĄC w stanie SET, aby loop wykonał: baselineX.current = hipX
  await act(async () => {
    jest.advanceTimersByTime(32); 
  });

  // 2. Teraz możemy bezpiecznie odpalić sygnał GO
  await act(async () => {
    if (triggerGo) triggerGo();
  });

  // 3. Czekamy 250ms "w blokach"
  await act(async () => {
    jest.advanceTimersByTime(250);
  });

  // 4. Biegacz wystrzeliwuje do przodu (zmieniamy referencję)
  mockLandmarksRef.current = [[
    { x: 0.6, y: 0.8, z: 0.1 }, 
    { x: 0.5, y: 0.9, z: 0.1 }, 
    { x: 0.5, y: 0.95, z: 0.1 }
  ]] as any;

  // 5. Pętla rejestruje ruch w fazie GO
  await act(async () => {
    jest.advanceTimersByTime(32);
  });

  // 6. Sprawdzamy czy pokazał się wynik w milisekundach
  const result = screen.getByText(/[0-9]+/);
  expect(result).toBeTruthy();

  sprintSpy.mockRestore();
});
});

