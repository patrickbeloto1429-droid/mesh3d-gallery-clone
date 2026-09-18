import * as THREE from 'three'

/**
 * A spiralling tunnel of points around the final stretch of the journey
 * — particles arranged on a rotating spiral tube that the camera flies
 * through, standing in for a "portal" moment before the outro.
 */
export function createVortex(centerZ: number, colorA: THREE.Color, colorB: THREE.Color, reach = 22) {
  const count = 3200
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const t = Math.random()
    const turns = 5.5
    const angle = t * Math.PI * 2 * turns + Math.random() * 0.3
    const radius = 1.5 + t * 9 + Math.sin(angle * 3.0) * 0.4
    const z = centerZ + (t - 0.5) * 26
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = Math.sin(angle) * radius + 1.0
    positions[i * 3 + 2] = z
    seeds[i] = Math.random() * 1000
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uFade: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vSeed;
      void main() {
        float angle = uTime * 0.15;
        float ca = cos(angle);
        float sa = sin(angle);
        vec3 pos = position;
        float x = pos.x * ca - pos.y * sa;
        float y = pos.x * sa + pos.y * ca;
        pos.x = x;
        pos.y = y;
        vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        float atten = clamp(20.0 / -mv.z, 0.2, 2.5);
        gl_PointSize = (1.2 + fract(aSeed) * 1.6) * atten * uPixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uFade;
      varying float vSeed;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float disc = 1.0 - smoothstep(0.0, 0.5, d);
        vec3 col = mix(uColorA, uColorB, fract(vSeed * 0.53));
        gl_FragColor = vec4(col, disc * 0.8 * uFade);
      }
    `,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  return {
    points,
    update(time: number, cameraZ: number) {
      material.uniforms.uTime.value = time
      const dist = Math.abs(cameraZ - centerZ)
      // Invisible until the camera is well within reach — seen from
      // hero-section distance this reads as a dense fingerprint-like
      // smear instead of a portal, since thousands of points compress
      // into a few screen pixels at long range.
      const fade = 1 - Math.min(1, Math.max(0, (dist - reach * 0.35) / (reach * 0.65)))
      material.uniforms.uFade.value = fade
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
