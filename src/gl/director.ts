import * as THREE from 'three';
import { Engine, SUN } from './engine';
import type { Beat } from '../timeline';
import { clamp01, smoothstep } from '../scroll';
import { FractureTransition } from './transitions/fracture';

const SCENES = ['horizon', 'dome', 'sea', 'finale'] as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Look {
  /** eye/pointer parallax, roughly -1..1 */
  camX: number;
  camY: number;
  time: number;
}

/** Turns a Beat (scene + transition progress) into render passes. All state derives from the Beat. */
export class Director {
  private fracture: FractureTransition;
  constructor(readonly eng: Engine) {
    this.fracture = new FractureTransition(eng);
  }

  private scene(i: number, target: THREE.WebGLRenderTarget, look: Look, z: number): void {
    const u = this.eng.u;
    (u.uCam.value as THREE.Vector3).set(look.camX, look.camY, z);
    this.eng.pass(SCENES[i], target);
  }

  /** debug: render a single scene with explicit z */
  debug: { scene: number; z: number } | null = null;

  render(beat: Beat, look: Look): void {
    const e = this.eng;
    const u = e.u;
    u.uTime.value = look.time;
    u.uShim.value = 0;
    u.uFade.value = 0;
    u.uCrack.value = 0;

    u.uGlow.value = beat.tr < 0 && beat.scene === 3 ? 1 + 0.5 * smoothstep(0.3, 1, beat.s) : 1;
    if (this.debug) {
      this.scene(this.debug.scene, e.rtComp, look, this.debug.z);
    } else if (beat.tr < 0) {
      this.scene(beat.scene, e.rtComp, look, 0);
    } else if (beat.tr === 0) {
      this.portal(beat.p, look);
    } else if (beat.tr === 1) {
      this.scene(1, e.rtFrom, look, 0);
      this.scene(2, e.rtTo, look, 0);
      u.tFrom.value = e.rtFrom.texture;
      u.tTo.value = e.rtTo.texture;
      u.uP.value = beat.p;
      this.fracture.render(beat.p);
    } else {
      this.liquid(beat.p, look);
    }
    e.post(e.rtComp);
  }

  /** T3 — the drop of light becomes the word. */
  private liquid(p: number, look: Look): void {
    const e = this.eng;
    const u = e.u;
    this.scene(2, e.rtFrom, look, 0);
    u.uAppear.value = smoothstep(0.8, 1.0, p);
    // while the light floods the frame the camera surges toward the word, then settles back onto it
    u.uZoom.value = 1 + 0.30 * smoothstep(0.7, 0.86, p) * (1 - smoothstep(0.86, 1.0, p));
    this.scene(3, e.rtTo, look, 0);
    u.uAppear.value = 1;
    u.uZoom.value = 1;
    u.tFrom.value = e.rtFrom.texture;
    u.tTo.value = e.rtTo.texture;
    u.uP.value = p;
    u.uRipple.value = Math.sin(Math.PI * smoothstep(0, 0.4, p));
    u.uOpen.value = smoothstep(0.04, 0.18, p);
    u.uMorph.value = smoothstep(0.2, 0.5, p);
    u.uFlood.value = Math.pow(smoothstep(0.68, 1.0, p), 1.6) * 1.7;
    e.pass('liquid', e.rtComp);
  }

  /** T1 — the sun becomes the aperture. */
  private portal(p: number, look: Look): void {
    const e = this.eng;
    const u = e.u;
    const asp = e.width / e.height;
    const shim = smoothstep(0, 0.45, p) * (1 - smoothstep(0.6, 0.85, p));
    const lens = smoothstep(0.04, 0.4, p);
    const pupil = smoothstep(0.2, 0.46, p);
    const ex = Math.pow(clamp01((p - 0.46) / 0.54), 2.2);
    const rMax = 0.5 * Math.hypot(asp, 1) * 1.35;
    const ra = lerp(SUN.r * pupil, rMax, ex);
    const dollyA = 0.12 * smoothstep(0, 0.4, p) + ex * 3.2;
    // B starts small inside the opening (a dark, radial iris around a bright pupil) and grows as we arrive
    const zoomB = -0.52 * Math.pow(1 - smoothstep(0.34, 1, p), 1.6);

    u.uShim.value = shim;
    u.uFade.value = smoothstep(0.28, 0.5, p);
    this.scene(0, e.rtFrom, look, dollyA);
    u.uShim.value = 0;
    u.uFade.value = 0;
    if (ra > 0.004) this.scene(1, e.rtTo, look, zoomB);

    u.tFrom.value = e.rtFrom.texture;
    u.tTo.value = e.rtTo.texture;
    u.uP.value = p;
    u.uAperture.value = ra;
    u.uLens.value = lens;
    e.pass('portal', e.rtComp);
  }
}
