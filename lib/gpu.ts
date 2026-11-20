/**
 * Detects when the browser is rendering WebGL on the CPU (hardware acceleration
 * off, GPU blocklisted, or the GPU process crashed and fell back). In that case
 * the 3D scene runs many times slower, so we tell the visitor how to fix it.
 */
export function isSoftwareRendering(): boolean {
  try {
    const canvas = document.createElement('canvas');
    // A context with this flag is refused when only a software renderer is available.
    const fast = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!fast) return true;

    const info = fast.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(fast.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    fast.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|basic render|warp|llvmpipe|software/i.test(renderer);
  } catch {
    return false;
  }
}
