# M9-M13 GAME LOOP REVIEW

## Verdict
READY_FOR_M14_M17

## Critical
None.

## Fixes Made
- Safehouse banking now requires wanted level 0 (Game.updateSafehouseBanking: added `if (this.wantedSystem.level > 0) return;`)

## Watch Items
- QuickCashMission has unused `robberyStarted` field (dead code)
- WantedSystem.forceLevel() is public; missions should use crime:committed with minWanted
- Abandoned stolen vehicles not reclaimed by TrafficSystem; entity count grows if player repeatedly steals/exits
- Police seesPlayer allocates new Ray per unit per frame (minor GC pressure)
- Pedestrian cap is 14 (config) but MASTER_PLAN targets 12-24

## M14-M17 Guardrails
1. Bust: call cash.loseCarriedCash(), wanted.setLevel(0), missionManager.active?.fail(), respawn player at safehouse, restore health
2. Mission failure: reuse Mission.fail() path; do not duplicate cleanup logic
3. Carried cash loss: only CashSystem.loseCarriedCash() mutates carriedCash to 0
4. UI lifecycle: MissionHUD hides when activeMission is null or state !== "active"; finale overlay only shown once on m3 completion
5. Free roam: after finale, missions remain completed, all systems (traffic, peds, wanted, police, safehouse, theft) stay active
6. No polish regressions: keep marker/material disposal in Mission.cleanup(); no per-frame allocations in hot paths
7. EventBus: never add handlers without tracking in Mission.handlers; cleanup() must remove all
8. Vehicle identity: M1 tracks missionVehicleId; verify M14 bust clears it
9. Wanted authority: only WantedSystem mutates level; missions request via crime:committed
10. Build must pass after every change; preserve M0-M13 behavior

## Build
- PASS

## Created
- ARCH_REVIEW_M13.md

## Next
Begin M14 (bust/health/combat). Verify M1-M3 playthrough after fix.