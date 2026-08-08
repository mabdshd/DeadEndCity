export interface GameState {
  mode: "title" | "playing" | "paused" | "busted" | "complete";
  playerHealth: number;
  bankedCash: number;
  carriedCash: number;
  wantedLevel: 0 | 1 | 2 | 3;
  currentMissionId: string | null;
  currentObjective: string | null;
  playerVehicleId: string | null;
}

export function createInitialState(): GameState {
  return {
    mode: "playing",
    playerHealth: 100,
    bankedCash: 0,
    carriedCash: 0,
    wantedLevel: 0,
    currentMissionId: null,
    currentObjective: null,
    playerVehicleId: null,
  };
}
