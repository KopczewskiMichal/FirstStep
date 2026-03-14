interface Config {
  treshold: number;
  recordingDuration: number; // 0 => brak nagrywania
  mode: "DLINE" | "SPRINT";
}

const DEFAULT_CONFIG: Config = {
  treshold: 0.05,
      recordingDuration: 3000, // milisekundy
      mode: "DLINE"
}

export const initSettings = () => {
  if (!localStorage.getItem("drillSettings")) {
    localStorage.setItem("drillSettings", JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
}

const getConfig = (): Config => {
  const saved = localStorage.getItem("drillSettings");
  if (!saved) {
    initSettings();
    return DEFAULT_CONFIG;
  }
  
  try {
    const parsed = JSON.parse(saved) as Config;
    return {... DEFAULT_CONFIG, ...parsed};
  } catch (error) {
    console.error("Error parsing saved settings:", error);
    return DEFAULT_CONFIG;

  }
}

export const getTreshold = () => {
  const config = getConfig();
  return 0.01 < config.treshold && config.treshold < 0.3 ? config.treshold : DEFAULT_CONFIG.treshold;
}

export const getRecordingDuration = () => {
  const config = getConfig();
  return config.recordingDuration <= 10_000 ? config.recordingDuration : DEFAULT_CONFIG.recordingDuration;
}

export const getMode = () => {
  const config = getConfig();
  return config.mode === "DLINE" || config.mode === "SPRINT" ? config.mode : DEFAULT_CONFIG.mode;
}

const updateConfig = (changes: Partial<Config>) => {
  const current = getConfig();
  const updated = { ...current, ...changes };
  localStorage.setItem("drillSettings", JSON.stringify(updated));
}