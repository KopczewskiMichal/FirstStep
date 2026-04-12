import React from 'react';
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom'; 
import SettingsComponent from "./SettingsComponent";
import * as settingsUtils from "./settings";

// 1. Mockujemy moduł settings, żeby przejąć kontrolę nad localStorage
jest.mock("./settings", () => ({
  getConfig: jest.fn(() => ({
    treshold: 0.1,
    recordingDuration: 3000,
    playbackSpeed: 1.0,
    mode: "DLINE"
  })),
  updateConfig: jest.fn()
}));

describe("SettingsComponent - Unit Tests", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("powinien zmieniać kolor trybu po kliknięciu i wywołać updateConfig", () => {
    render(<SettingsComponent onClose={mockOnClose} />);

    const footballBtn = screen.getByText(/FOOTBALL/i);
    const sprintBtn = screen.getByText(/SPRINT/i);

    // Na starcie Football jest pomarańczowy (z mocka)
    (expect(footballBtn) as any).toHaveClass('bg-orange-600');

    // Klikamy SPRINT
    fireEvent.click(sprintBtn);

    // Sprawdzamy kolory (UI re-render)
    (expect(sprintBtn) as any).toHaveClass('bg-orange-600');
    (expect(footballBtn) as any).not.toHaveClass('bg-orange-600');

    // Sprawdzamy czy poszło do localStorage (funkcja updateConfig)
    expect(settingsUtils.updateConfig).toHaveBeenCalledWith({ mode: "SPRINT" });
  });

  it("powinien aktualizować treshold (Sensitivity) i widok po zmianie suwaka", () => {
    render(<SettingsComponent onClose={mockOnClose} />);

    // Szukamy suwaka po wartości lub labelu. Najbezpieczniej po roli slider.
    const sliders = screen.getAllByRole('slider');
    const thresholdSlider = sliders[0]; // Sensitivity

    fireEvent.change(thresholdSlider, { target: { value: '0.25' } });

    // Czy UI wyświetla nową wartość?
    (expect(screen.getByText('0.25')) as any).toBeInTheDocument();
    
    // Czy zapisało do localStorage?
    expect(settingsUtils.updateConfig).toHaveBeenCalledWith({ treshold: 0.25 });
  });

  it("powinien aktualizować Recording Duration", () => {
    render(<SettingsComponent onClose={mockOnClose} />);

    const sliders = screen.getAllByRole('slider');
    const durationSlider = sliders[1]; // Duration

    fireEvent.change(durationSlider, { target: { value: '5000' } });

    (expect(screen.getByText('5000')) as any).toBeInTheDocument();
    expect(settingsUtils.updateConfig).toHaveBeenCalledWith({ recordingDuration: 5000 });
  });

  it("powinien wywołać onClose po kliknięciu przycisku Close", () => {
    render(<SettingsComponent onClose={mockOnClose} />);
    
    const closeBtn = screen.getByText(/Close/i);
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});