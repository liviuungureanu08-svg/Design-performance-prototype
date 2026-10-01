// Debug-only device report for the Motion Proof (enabled by ?diag; absent from the normal experience).
// Lets a physical phone show why the scene would not render: WebGL2, GPU, the float/half-float capabilities the
// accumulation depends on, render-target type, framebuffer status, context loss, warnings and errors.
import type * as THREE from 'three';

export function makeDiag(enabled: boolean) {
  const lines: string[] = [];
  let box: HTMLPreElement | null = null;
  const show = () => { if (box) box.textContent = lines.join('\n'); };
  const log = (s: string) => { if (!enabled) return; lines.push(s); show(); };
  if (enabled) {
    box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:6px;right:6px;top:44px;z-index:9;margin:0;padding:8px;max-height:60vh;overflow:auto;'
      + 'font:10px/1.35 ui-monospace,monospace;color:#cfe;background:rgba(0,0,0,.72);white-space:pre-wrap;pointer-events:auto';
    document.body.append(box);
    window.addEventListener('error', (e) => log('error: ' + e.message));
    window.addEventListener('unhandledrejection', (e) => log('rejection: ' + String(e.reason)));
    for (const k of ['warn', 'error'] as const) {
      const orig = console[k].bind(console);
      console[k] = (...a: unknown[]) => { log(k + ': ' + a.map(String).join(' ').slice(0, 300)); orig(...a); };
    }
  }
  return {
    enabled,
    log,
    report(r: THREE.WebGLRenderer, canvas: HTMLCanvasElement) {
      if (!enabled) return;
      const gl = r.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const has = (n: string) => (r.extensions.has(n) ? 'yes' : 'NO');
      log(`webgl2: ${r.capabilities.isWebGL2}  dpr: ${devicePixelRatio}  canvas: ${canvas.width}x${canvas.height}`);
      log(`gpu: ${dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)}`);
      log(`maxTexture: ${r.capabilities.maxTextureSize}  precision: ${r.capabilities.precision}`);
      log(`EXT_color_buffer_float: ${has('EXT_color_buffer_float')}  OES_texture_float_linear: ${has('OES_texture_float_linear')}`);
      log(`EXT_color_buffer_half_float: ${has('EXT_color_buffer_half_float')}  EXT_float_blend: ${has('EXT_float_blend')}`);
      canvas.addEventListener('webglcontextlost', () => log('WEBGL CONTEXT LOST'));
      canvas.addEventListener('webglcontextrestored', () => log('webgl context restored'));
    },
    target(name: string, r: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget) {
      if (!enabled) return;
      const gl = r.getContext() as WebGL2RenderingContext;
      r.setRenderTarget(rt);
      const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      r.setRenderTarget(null);
      log(`${name}: type ${rt.texture.type} filter ${rt.texture.minFilter}/${rt.texture.magFilter}  fbo ${st === gl.FRAMEBUFFER_COMPLETE ? 'complete' : 'INCOMPLETE 0x' + st.toString(16)}`);
    },
  };
}
export type Diag = ReturnType<typeof makeDiag>;
