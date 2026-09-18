import * as THREE from 'three'

/**
 * A particle "card" standing in for a solution's screenshot — a dense
 * grid of points that scatters into a diffuse cloud when off-screen and
 * assembles into a flat card silhouette as its station comes into
 * focus, with a cursor-reactive repel + glow. Parented to the camera
 * (see GalleryScene.ts) at a fixed local offset so it always sits
 * exactly where the DOM title/caption are centered, regardless of the
 * camera's pitch or sway.
 */
export function createPickCloud(colorA: THREE.Color, colorB: THREE.Color, seedOffset: number) {
  const cols = 42
  const rows = 30
  const count = cols * rows
  const cardW = 3.1
  const cardH = 2.15

  const positions = new Float32Array(count * 3)
  const grid = new Float32Array(count * 2)
  const seeds = new Float32Array(count)
  const colorT = new Float32Array(count)

  let i = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const gx = (x / (cols - 1) - 0.5) * cardW
      const gy = (0.5 - y / (rows - 1)) * cardH
      grid[i * 2] = gx
      grid[i * 2 + 1] = gy
      positions[i * 3] = gx
      positions[i * 3 + 1] = gy
      positions[i * 3 + 2] = 0
      seeds[i] = Math.random() * 1000 + seedOffset
      // Gradient runs top-left -> bottom-right, matching the brand's
      // 135deg signature gradient direction.
      colorT[i] = (x / (cols - 1) + (1 - y / (rows - 1))) * 0.5
      i++
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aGrid', new THREE.BufferAttribute(grid, 2))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aColorT', new THREE.BufferAttribute(colorT, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uCursorNDC: { value: new THREE.Vector2(0, 0) },
      uHoverActive: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec2 aGrid;
      attribute float aSeed;
      attribute float aColorT;
      uniform float uTime;
      uniform float uReveal;
      uniform vec2 uCursorNDC;
      uniform float uHoverActive;
      uniform float uPixelRatio;
      varying float vColorT;
      varying float vAlpha;
      varying float vHoverFall;

      void main() {
        // Ease-out quartic so the assembly settles softly instead of
        // snapping, with a per-particle stagger for an organic build.
        float stagger = fract(aSeed * 0.137) * 0.4;
        float t = clamp((uReveal - stagger) / max(1.0 - stagger, 0.0001), 0.0, 1.0);
        float ease = 1.0 - pow(1.0 - t, 4.0);

        // Scattered pose: a loose cloud drifting in front of the camera.
        vec3 scattered = vec3(
          (fract(aSeed * 12.9) - 0.5) * 6.0,
          (fract(aSeed * 78.2) - 0.5) * 4.5,
          (fract(aSeed * 37.5)) * 3.0 + 0.5
        );
        vec3 formed = vec3(aGrid, 0.0);
        vec3 pos = mix(scattered, formed, ease);

        // A faint idle drift once formed so the card never looks frozen.
        pos.x += sin(uTime * 0.6 + aSeed) * 0.01 * ease;
        pos.y += cos(uTime * 0.5 + aSeed * 1.3) * 0.01 * ease;

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vec4 clip = projectionMatrix * mvPos;

        // Cursor-reactive repel + glow in clip space.
        float hoverFall = 0.0;
        if (uHoverActive > 0.001 && ease > 0.05) {
          vec2 ndc = clip.xy / max(clip.w, 0.0001);
          vec2 toCursor = ndc - uCursorNDC;
          float d = length(toCursor);
          float radius = 0.28;
          hoverFall = exp(-(d * d) / (radius * radius)) * uHoverActive * ease;
          float t2 = d / radius;
          float radial = t2 * exp(1.0 - t2 * t2);
          vec2 dir = toCursor / max(d, 0.0001);
          clip.xy += dir * radial * 0.06 * uHoverActive * clip.w;
        }

        gl_Position = clip;
        vColorT = aColorT;
        vAlpha = ease;
        vHoverFall = hoverFall;

        float atten = clamp(9.0 / max(-mvPos.z, 0.5), 0.4, 2.2);
        gl_PointSize = (2.4 + hoverFall * 3.0) * atten * uPixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vColorT;
      varying float vAlpha;
      varying float vHoverFall;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float disc = 1.0 - smoothstep(0.3, 0.5, d);
        vec3 col = mix(uColorA, uColorB, vColorT);
        col = mix(col, vec3(1.0), clamp(vHoverFall * 1.4, 0.0, 0.85));
        gl_FragColor = vec4(col, disc * vAlpha * (0.75 + vHoverFall * 0.25));
      }
    `,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 200

  return {
    points,
    update(time: number, reveal: number, cursorNDC: THREE.Vector2, hoverActive: number) {
      material.uniforms.uTime.value = time
      material.uniforms.uReveal.value = reveal
      material.uniforms.uCursorNDC.value.copy(cursorNDC)
      material.uniforms.uHoverActive.value = hoverActive
      points.visible = reveal > 0.001
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
