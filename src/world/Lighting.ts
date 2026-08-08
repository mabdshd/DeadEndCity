import { Color3, Color4, DirectionalLight, HemisphericLight, Scene, Vector3 } from "@babylonjs/core";

export function setupLighting(scene: Scene): void {
  scene.clearColor = new Color4(0.1, 0.11, 0.2, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0045;
  scene.fogColor = new Color3(0.1, 0.11, 0.2);
  scene.ambientColor = new Color3(0.22, 0.22, 0.3);

  const hemi = new HemisphericLight("hemi", new Vector3(0.1, 1, 0.3), scene);
  hemi.intensity = 0.55;
  hemi.diffuse = new Color3(0.62, 0.66, 0.9);
  hemi.specular = new Color3(0.2, 0.2, 0.3);

  const sun = new DirectionalLight("sun", new Vector3(0.45, -0.85, 0.4), scene);
  sun.intensity = 1.0;
  sun.diffuse = new Color3(1.0, 0.5, 0.28);
  sun.specular = new Color3(0.9, 0.6, 0.4);
}
