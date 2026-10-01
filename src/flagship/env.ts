import * as THREE from 'three';

/** An authored, dark studio: broad soft boxes for form, thin strips for edges. Baked once through PMREM. */
export function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec3 p; void main(){ float h = normalize(p).y; vec3 c = mix(vec3(0.006,0.0065,0.008), vec3(0.03,0.032,0.036), smoothstep(-0.1,0.9,h)); gl_FragColor = vec4(c,1.); }',
    })
  );
  s.add(dome);

  const panel = (pos: [number, number, number], w: number, h: number, intensity: number, tint: [number, number, number], falloff = 0) => {
    const g = new THREE.PlaneGeometry(w, h, 1, 8);
    const col: number[] = [];
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) / h + 0.5); // 0 bottom .. 1 top
      const k = 1 - falloff * (1 - t);
      col.push(tint[0] * k, tint[1] * k, tint[2] * k);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    m.material.color.setScalar(intensity);
    m.position.set(...pos);
    m.lookAt(0, 3, 0);
    s.add(m);
  };
  // key: large overhead soft box, warm-neutral
  panel([0, 22, 4], 22, 14, 40, [1.0, 0.97, 0.92]);
  // front-right: wide graded panel; gives the front faces a long soft gradient
  panel([9, 8, 20], 14, 22, 22, [1.0, 0.98, 0.95], 0.9);
  // back-left tall panel: the left flank of the tall mass catches a vertical gradient
  panel([-12, 8, -18], 10, 24, 26, [0.95, 0.97, 1.0], 0.85);
  // edge strip on the right-back: defines the right silhouette
  panel([12, 6, -8], 1.5, 26, 60, [1.0, 0.96, 0.9]);
  panel([0, 0.2, 18], 24, 2.5, 4, [1, 1, 1]);

  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02, 0.1, 100, { size: 256 });
  pm.dispose();
  s.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material | undefined)?.dispose();
  });
  return rt.texture;
}
