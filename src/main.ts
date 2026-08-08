import { Game } from "./game/Game";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const startButton = document.getElementById("start-button") as HTMLButtonElement;
const overlay = document.getElementById("title-overlay") as HTMLDivElement;

let game: Game | null = null;

startButton.addEventListener("click", () => {
  if (game) return;
  game = new Game(canvas);
  game.audio.init();
  overlay.classList.add("hidden");
  game.start();
});

if (new URLSearchParams(location.search).has("autostart")) {
  game = new Game(canvas);
  game.audio.init();
  overlay.classList.add("hidden");
  game.start();
  (window as unknown as { __game: Game }).__game = game;
}
