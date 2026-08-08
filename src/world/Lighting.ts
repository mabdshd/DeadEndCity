import { Color3, Color4, DirectionalLight, HemisphericLight, Scene, Vector3 } from "@babylonjs/core";

export function setupLighting(scene: Scene): void {
  scene.clearColor = new Color4(0.07, 0.05, 0.1, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0052;
  scene.fogColor = new Color3(0.13, 0.07, 0.15);
  scene.ambientColor = new Color3(0.28, 0.22, 0.34);

  const hemi = new HemisphericLight("hemi", new Vector3(0.1, 1, 0.3), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = new Color3(0.58, 0.52, 0.8);
  hemi.specular = new Color3(0.2, 0.2, 0.3);

  const sun = new DirectionalLight("sun", new Vector3(0.45, -0.85, 0.4), scene);
  sun.intensity = 1.15;
  sun.diffuse = new Color3(1.0, 0.4, 0.2);
  sun.specular = new Color3(0.95, 0.55, 0.35);
}
