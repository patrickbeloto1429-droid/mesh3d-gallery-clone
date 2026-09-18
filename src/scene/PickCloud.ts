import * as THREE from 'three'
import type { IconShape } from './iconShapes'

/**
 * A particle object standing in for a solution — a recognizable 3D
 * silhouette (see iconShapes.ts) that scatters into a diffuse cloud
 * when off-screen and assembles as its station comes into focus, with
 * a cursor-reactive repel + glow and a slow continuous spin so its
 * volume actually reads as 3D. Parented to the camera (see
 * GalleryScene.ts) at a fixed local offset so it always sits exactly
 * where the DOM title/caption are centered, regardless of the
 * camera's pitch or sway.
 */
export function createPickCloud(shape: IconShape, colorA: THREE.Color, colorB: THREE.Color, seedOffset: number) {
  const count = shape.positions.length / 3
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) seeds[i] = Math.random() * 1000 + seedOffset

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(shape.positions.slice(), 3))
  geometry.setAttribute('aFormed', new THREE.BufferAttribute(shape.positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aColorT', new THREE.BufferAttribute(shape.colorT, 1))

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
      attribute vec3 aFormed;
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
        vec3 pos = mix(scattered, aFormed, ease);

        // A faint idle bob so the object never looks frozen, plus a
        // slow continuous spin once mostly formed — this is what
        // actually sells the silhouette as a solid 3D object rather
        // than a flat cutout.
        pos.y += cos(uTime * 0.5 + aSeed * 1.3) * 0.01 * ease;
        float spin = uTime * 0.28 * ease;
        float ca = cos(spin);
        float sa = sin(spin);
        pos.xz = mat2(ca, sa, -sa, ca) * pos.xz;

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
        gl_PointSize = (2.6 + hoverFall * 3.0) * atten * uPixelRatio;
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
