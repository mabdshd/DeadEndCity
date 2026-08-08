export class InputManager {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private buttons = new Set<number>();
  private buttonsPressed = new Set<number>();
  private mouseDX = 0;
  private mouseDY = 0;
  private locked = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("pointerlockchange", this.onLockChange);
    canvas.addEventListener("mousedown", this.onCanvasClick);
    canvas.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("blur", this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (e.code === "Tab") e.preventDefault();
    this.keys.add(e.code);
    this.pressed.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.locked) return;
    this.mouseDX += e.movementX;
    this.mouseDY += e.movementY;
  };

  private onCanvasClick = (): void => {
    this.requestPointerLock();
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.buttons.add(e.button);
    this.buttonsPressed.add(e.button);
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.buttons.delete(e.button);
  };

  private onBlur = (): void => {
    this.buttons.clear();
    this.keys.clear();
  };

  private onLockChange = (): void => {
    this.locked = document.pointerLockElement === this.canvas;
  };

  requestPointerLock(): void {
    if (!this.locked && this.canvas.requestPointerLock) {
      const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      p?.catch?.(() => {});
    }
  }

  isPointerLocked(): boolean {
    return this.locked;
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  getAxis(neg: string, pos: string): number {
    return (this.isDown(pos) ? 1 : 0) - (this.isDown(neg) ? 1 : 0);
  }

  consumeMouseDelta(): { x: number; y: number } {
    const d = { x: this.mouseDX, y: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return d;
  }

  consumePressed(code: string): boolean {
    return this.pressed.delete(code);
  }

  isMouseDown(button: number): boolean {
    return this.buttons.has(button);
  }

  consumePressedButton(button: number): boolean {
    return this.buttonsPressed.delete(button);
  }

  endFrame(): void {
    this.pressed.clear();
    this.buttonsPressed.clear();
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("pointerlockchange", this.onLockChange);
    this.canvas.removeEventListener("mousedown", this.onCanvasClick);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("blur", this.onBlur);
  }
}
