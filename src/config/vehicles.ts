export interface VehicleDef {
  id: string;
  topSpeed: number;
  reverseSpeed: number;
  acceleration: number;
  braking: number;
  maxTurn: number;
  turnAtSpeed: number;
  handbrakeTurn: number;
  drag: number;
  length: number;
  width: number;
  height: number;
  color: [number, number, number];
}

export const VEHICLE_DEFS: Record<string, VehicleDef> = {
  sport: {
    id: "sport",
    topSpeed: 26,
    reverseSpeed: 8,
    acceleration: 16,
    braking: 30,
    maxTurn: 2.4,
    turnAtSpeed: 5,
    handbrakeTurn: 3.2,
    drag: 1.1,
    length: 4.4,
    width: 1.9,
    height: 1.25,
    color: [0.92, 0.22, 0.18],
  },
  sedan: {
    id: "sedan",
    topSpeed: 20,
    reverseSpeed: 7,
    acceleration: 10,
    braking: 24,
    maxTurn: 2.2,
    turnAtSpeed: 4,
    handbrakeTurn: 2.8,
    drag: 0.9,
    length: 4.6,
    width: 1.95,
    height: 1.45,
    color: [0.2, 0.5, 0.9],
  },
  police: {
    id: "police",
    topSpeed: 23,
    reverseSpeed: 7.5,
    acceleration: 12,
    braking: 26,
    maxTurn: 2.2,
    turnAtSpeed: 4.5,
    handbrakeTurn: 2.9,
    drag: 1.0,
    length: 4.8,
    width: 1.95,
    height: 1.5,
    color: [0.95, 0.95, 0.95],
  },
  taxi: {
    id: "taxi",
    topSpeed: 20,
    reverseSpeed: 7,
    acceleration: 10,
    braking: 24,
    maxTurn: 2.2,
    turnAtSpeed: 4,
    handbrakeTurn: 2.8,
    drag: 0.9,
    length: 4.6,
    width: 1.95,
    height: 1.45,
    color: [0.98, 0.82, 0.15],
  },
  van: {
    id: "van",
    topSpeed: 16,
    reverseSpeed: 6,
    acceleration: 8,
    braking: 22,
    maxTurn: 2.0,
    turnAtSpeed: 4,
    handbrakeTurn: 2.4,
    drag: 0.8,
    length: 5.2,
    width: 2.1,
    height: 1.8,
    color: [0.38, 0.68, 0.42],
  },
  sedanDark: {
    id: "sedanDark",
    topSpeed: 20,
    reverseSpeed: 7,
    acceleration: 10,
    braking: 24,
    maxTurn: 2.2,
    turnAtSpeed: 4,
    handbrakeTurn: 2.8,
    drag: 0.9,
    length: 4.6,
    width: 1.95,
    height: 1.45,
    color: [0.22, 0.24, 0.28],
  },
};

export const TRAFFIC_DEF_IDS = ["sedan", "sedanDark", "taxi", "van"];
