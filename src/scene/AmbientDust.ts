import * as THREE from 'three'

/**
 * A drifting field of point-sprite dust spanning the whole scroll depth,
 * biased so most particles sit near the terrain's horizon band rather
 * than spread evenly — that's what reads as "glowing ground fog" instead
 * of a generic starfield. Each point twinkles on its own phase.
 */
export function createAmbientDust(count: number, length: number, colorA: THREE.Color, colorB: THREE.Color) {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const z = -Math.random() * length
    const horizonBias = Math.pow(Math.random(), 2.2) // cluster low
    const y = -2.6 + horizonBias * 5.5 - 1.0
    const spread = 5 + horizonBias * 22
    const x = (Math.random() - 0.5) * spread
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    seeds[i] = Math.random() * 1000
    sizes[i] = Math.random() * 2.2 + 0.6
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vTwinkle;
      varying float vSeed;
      void main() {
        vec3 pos = position;
        pos.x += sin(uTime * 0.3 + aSeed) * 0.15;
        pos.y += sin(uTime * 0.5 + aSeed * 1.7) * 0.1;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 6.28);
        vSeed = aSeed;
        gl_Position = projectionMatrix * mv;
        float atten = clamp(24.0 / -mv.z, 0.3, 3.0);
        gl_PointSize = aSize * atten * uPixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vTwinkle;
      varying float vSeed;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float disc = 1.0 - smoothstep(0.0, 0.5, d);
        vec3 col = mix(uColorA, uColorB, fract(vSeed * 0.37));
        gl_FragColor = vec4(col, disc * (0.35 + 0.65 * vTwinkle));
      }
    `,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  return {
    points,
    update(time: number) {
      material.uniforms.uTime.value = time
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
