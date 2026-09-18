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
      uHorizon: { value: 0.42 },
      uGlow: { value: 1.0 },
      uAspect: { value: 1.0 },
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
      ${NOISE_GLSL}

      void main() {
        vec2 uv = vUv;
        vec2 centered = (uv - vec2(0.5, 0.0)) * vec2(uAspect, 1.0);

        // Distance above the horizon line — the "sky" fades to pure
        // black well above it, the glow concentrates just below it.
        float aboveHorizon = uv.y - uHorizon;

        // Radiating streaks: angle from a point just below the frame,
        // perturbed by low-frequency noise so they read as uneven light
        // rays rather than a perfect fan.
        vec2 rayOrigin = vec2(0.0, -0.65);
        vec2 toPixel = centered - rayOrigin;
        float angle = atan(toPixel.x, toPixel.y);
        float rays = sin(angle * 9.0 + fbm(vec2(angle * 2.0, uTime * 0.02)) * 3.0);
        rays = smoothstep(0.75, 1.0, rays);

        // Soft drifting aurora bands below the horizon.
        float bandNoise = fbm(vec2(uv.x * 2.2, uv.y * 3.0 - uTime * 0.015) );
        float bands = fbm(vec2(uv.x * 1.1 + bandNoise * 0.4, uTime * 0.01));

        float glowFall = exp(-max(aboveHorizon, 0.0) * 7.0);
        float belowFall = smoothstep(-0.55, 0.0, -aboveHorizon);

        float raysStrength = rays * glowFall * 0.28;
        float bandStrength = (bands * 0.5 + 0.5) * belowFall * uGlow;

        float intensity = clamp(bandStrength * 0.85 + raysStrength, 0.0, 1.4);
        vec3 col = mix(uColorA, uColorB, clamp(intensity, 0.0, 1.0));
        col *= intensity;

        // Pure black sky far above the horizon.
        float skyMask = smoothstep(0.02, 0.5, aboveHorizon);
        col = mix(col, vec3(0.0), skyMask);

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
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
