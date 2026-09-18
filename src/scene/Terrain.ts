import * as THREE from 'three'
import { NOISE_GLSL } from './noise.glsl'

/**
 * A long displaced ground plane running the full depth of the scroll
 * journey. Vertex noise gives it rolling dune-like ridges; the fragment
 * shader adds a moving glow and brightens near the crest so it reads as
 * a luminous terrain rather than flat geometry.
 */
export function createTerrain(length: number, colorA: THREE.Color, colorB: THREE.Color) {
  const width = 70
  const segsX = 80
  const segsZ = Math.round(length / 1.2)
  const geometry = new THREE.PlaneGeometry(width, length, segsX, segsZ)
  geometry.rotateX(-Math.PI / 2)

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uLength: { value: length },
    },
    vertexShader: /* glsl */ `
      varying float vHeight;
      varying float vFade;
      uniform float uTime;
      uniform float uLength;
      ${NOISE_GLSL}
      void main() {
        vec3 pos = position;
        float n = fbm(vec2(pos.x * 0.06, pos.z * 0.06 + uTime * 0.03));
        float ridge = fbm(vec2(pos.x * 0.12 - 4.0, pos.z * 0.05));
        float h = n * 1.6 + ridge * 0.8;
        pos.y += h;
        vHeight = h;
        // Fade the very near edge (under the camera) and the far edge
        // (beyond the last station) so the plane doesn't show a hard cut.
        float distFromStart = -pos.z;
        vFade = smoothstep(0.0, 6.0, distFromStart) * (1.0 - smoothstep(uLength - 10.0, uLength, distFromStart));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying float vHeight;
      varying float vFade;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      void main() {
        // Capped well short of 1.0 — this used to reach pure, fully
        // saturated colorB at modest heights and blow out to a flat
        // neon wall wherever the camera passed close to a ridge.
        float t = clamp(vHeight * 0.32 + 0.28, 0.0, 0.72);
        vec3 col = mix(uColorA, uColorB, t);
        // Only the sharpest crests get an extra glow, and only a little.
        float glow = smoothstep(0.9, 1.6, vHeight);
        col += uColorB * glow * 0.22;
        gl_FragColor = vec4(col, 0.62 * vFade);
      }
    `,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, -2.6, -length / 2 + 6)
  mesh.frustumCulled = false

  return {
    mesh,
    update(time: number) {
      material.uniforms.uTime.value = time
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
