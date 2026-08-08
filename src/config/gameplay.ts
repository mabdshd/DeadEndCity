export const PLAYER_CONFIG = {
  walkSpeed: 5.2,
  sprintSpeed: 7.6,
  jumpSpeed: 5.4,
  gravity: 26,
  accel: 60,
  height: 1.8,
  radius: 0.35,
};

export const FOOT_CAMERA = {
  distance: 5.5,
  height: 1.6,
  fov: 1.0,
  sensitivity: 0.0024,
  followLerp: 9,
  pitchMin: -0.55,
  pitchMax: 1.1,
};

export const VEHICLE_CAMERA = {
  distance: 8.5,
  height: 2.2,
  fov: 1.08,
  sensitivity: 0.0024,
  followLerp: 11,
  yawFollowSpeed: 5,
  lookOffsetMax: 0.7,
  pitchMin: -0.55,
  pitchMax: 0.9,
};

export const INTERACTION_RANGE = 3.4;
export const VEHICLE_EXIT_OFFSET = 2.6;

export const SAFEHOUSE_CONFIG = {
  bankRadius: 7,
};

export const MISSION_CONFIG = {
  rewards: { m1: 500, m2: 1000, m3: 2000 },
  robDuration: 2.5,
  triggerRadius: 6,
  dropOffRadius: 7,
  startRadius: 9,
};

export const TRAFFIC_CONFIG = {
  cap: 10,
  despawnDist: 130,
  stuckDespawnTime: 8,
  stuckReverseTime: 4,
  obstacleDist: 11,
  nodeReachDist: 3.4,
  speedMul: 0.62,
  minSpawnDistFromPlayer: 26,
  maxSpawnDistFromPlayer: 120,
};

export const PEDESTRIAN_CONFIG = {
  cap: 14,
  despawnDist: 130,
  wanderRange: 24,
  idleMin: 2,
  idleMax: 5,
  walkSpeed: 1.6,
  runSpeed: 4.2,
  fleeTime: 4,
  fleeDist: 12,
};

export const WANTED_CONFIG = {
  escapeTimes: [0, 8, 12, 16],
};

export const POLICE_CONFIG = {
  caps: [0, 1, 2, 3],
  spawnInterval: 1.2,
  minSpawnDist: 45,
  maxSpawnDist: 150,
  contactRange: 55,
  chaseDirectRange: 45,
  stuckDespawnTime: 8,
  disengageTime: 2.5,
  throttleMul: 0.72,
  predictionFactor: 0.6,
};
