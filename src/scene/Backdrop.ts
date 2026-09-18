import * as THREE from 'three'
import { NOISE_GLSL } from './noise.glsl'

/**
 * A screen-filling plane parented to the camera: the near-black "sky"
 * fading into a glowing band near the horizon, with faint noise-driven
 * light-ray streaks radiating from below. Sits far enough in front of
 * the camera that it always reads as an atmosphere, not a physical wall.
 */
export function createBackdrop(colorA: THREE.Color, colorB: THREE.Color) {
  const geometry = new THREE.PlaneGeometry(2, 2)
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uHorizon: { value: 0.3 },
      uGlow: { value: 1.0 },
      uAspect: { value: 1.0 },
      uMouseUv: { value: new THREE.Vector2(0.5, 0.3) },
      uHoverStrength: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uHorizon;
      uniform float uGlow;
      uniform float uAspect;
      uniform vec2 uMouseUv;
      uniform float uHoverStrength;
      ${NOISE_GLSL}

      void main() {
        vec2 uv = vUv;
        vec2 centered = (uv - vec2(0.5, 0.0)) * vec2(uAspect, 1.0);

        // Distance above the horizon line — the "sky" fades to pure
        // black well above it, the glow concentrates just below it.
        float aboveHorizon = uv.y - uHorizon;

        // Faint near-vertical light shafts — built as a per-column
        // stripe pattern (not radiating from a point) so there is no
        // singularity to produce ring artifacts. A touch of domain
        // warping keeps them from looking like a perfect picket fence.
        float warp = fbm(vec2(centered.x * 0.5, uTime * 0.04)) * 0.6;
        float rays = sin((centered.x + warp) * 7.0);
        rays = smoothstep(0.82, 1.0, rays);
        float rayReach = exp(-centered.x * centered.x * 0.2);

        // Soft drifting aurora, built from two noise octaves at
        // different scales so it reads as wispy cloud rather than flat
        // gradient bands.
        float bandNoise = fbm(vec2(uv.x * 2.2, uv.y * 3.0 - uTime * 0.015));
        float bands = fbm(vec2(uv.x * 1.1 + bandNoise * 0.4, uTime * 0.01));
        float wisp = fbm(vec2(uv.x * 5.5 - uTime * 0.02, uv.y * 6.0));

        float glowFall = exp(-max(aboveHorizon, 0.0) * 9.0);
        float belowFall = exp(-max(-aboveHorizon, 0.0) * 2.2);

        float raysStrength = rays * rayReach * glowFall * 0.14;
        float bandStrength = (bands * 0.35 + wisp * 0.15 + 0.4) * belowFall * uGlow;

        float intensity = clamp(bandStrength * 0.6 + raysStrength, 0.0, 1.0);
        vec3 col = mix(uColorA, uColorB, clamp(intensity, 0.0, 1.0));
        col *= intensity;

        // Pure black sky above the horizon — the glow only ever
        // occupies the lower third or so of the frame.
        float skyMask = smoothstep(0.0, 0.22, aboveHorizon);
        col = mix(col, vec3(0.0), skyMask);

        // Cursor-reactive iridescent shimmer — an oil-slick blob of
        // shifting cyan/pink/violet that blooms under the pointer and
        // fades once it stops moving.
        vec2 mouseCentered = (uMouseUv - vec2(0.5, 0.0)) * vec2(uAspect, 1.0);
        float distToMouse = length(centered - mouseCentered);
        float hoverGlow = exp(-distToMouse * distToMouse * 45.0) * uHoverStrength;
        if (hoverGlow > 0.001) {
          float iridA = fbm(vec2(centered.x * 10.0 + uTime * 0.45, centered.y * 10.0 - uTime * 0.3));
          float iridB = fbm(vec2(centered.y * 8.0 - uTime * 0.25, centered.x * 8.0 + uTime * 0.2));
          vec3 cyan = vec3(0.36, 0.94, 1.0);
          vec3 pink = vec3(1.0, 0.38, 0.68);
          vec3 violet = vec3(0.62, 0.42, 1.0);
          vec3 oil = mix(cyan, pink, smoothstep(-0.4, 0.4, iridA));
          oil = mix(oil, violet, smoothstep(0.25, 0.85, iridB));
          col = mix(col, oil, clamp(hoverGlow * 0.85, 0.0, 0.85));
        }

        // Dither: without this, the smooth gradient above quantizes to
        // visible concentric banding rings at 8-bit output precision.
        float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
        col += dither;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = -10

  return {
    mesh,
    update(time: number, aspect: number) {
      material.uniforms.uTime.value = time
      material.uniforms.uAspect.value = aspect
    },
    setColors(a: THREE.Color, b: THREE.Color) {
      material.uniforms.uColorA.value = a
      material.uniforms.uColorB.value = b
    },
    setGlow(v: number) {
      material.uniforms.uGlow.value = v
    },
    setHover(uv: THREE.Vector2, strength: number) {
      material.uniforms.uMouseUv.value.copy(uv)
      material.uniforms.uHoverStrength.value = strength
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
