interface Config {
  treshold: number;
  recordingDuration: number; // 0 -> brak nagrywania
  mode: "DLINE" | "SPRINT";
  pre_snap_time_limits: [number, number];
  sprint_wait_time: number;
}

const DEFAULT_CONFIG: Config = {
  treshold: 0.05,
  recordingDuration: 3000,
  mode: "DLINE",
  pre_snap_time_limits: [2000, 7000],
  sprint_wait_time: 5000
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

export const getPreSnapTimeLimits = () => {
  const config = getConfig();
  const [min, max] = config.pre_snap_time_limits;
  if (0 < min && min < max && max <= 15_000) {
    return [min, max] as [number, number];
  } else {
    return DEFAULT_CONFIG.pre_snap_time_limits;
  }
}

export const getSprintWaitTime = () => {
  const config = getConfig();
  return config.sprint_wait_time <= 15_000 ? config.sprint_wait_time : DEFAULT_CONFIG.sprint_wait_time;
}

const updateConfig = (changes: Partial<Config>) => {
  const current = getConfig();
  const updated = { ...current, ...changes };
  localStorage.setItem("drillSettings", JSON.stringify(updated));
}