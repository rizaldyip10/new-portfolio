/** Point-sprite vertex shader: per-point alpha, size attenuated by depth. */
export const GLOW_VERT = /* glsl */ `
attribute float alpha;
varying float vA;
uniform float uSize;
void main() {
  vA = alpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (300.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;

export const GLOW_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
varying float vA;
void main() {
  vec4 t = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(uColor, t.a * vA);
}`;

export const POST_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/**
 * The CRT pass. Order matters: power-collapse warps UV space first, then
 * barrel distortion bends the glass, then tear bands displace scanlines,
 * then we sample. Doing distortion after sampling would blur the mask.
 */
export const POST_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2  uRes;
uniform float uTime;
uniform float uVel;
uniform float uGlitch;
uniform float uPower;
uniform float uLow;
varying vec2 vUv;

float hash(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float p){ return fract(sin(p * 78.233) * 43758.5453); }

void main() {
  vec2 uv = vUv;

  // Power-off: collapse vertically to a line, then horizontally to a dot.
  float pw = clamp(uPower, 0.0, 1.0);
  float vScale = smoothstep(0.0, 0.55, pw);
  float hScale = smoothstep(0.55, 1.0, pw) * 0.85 + 0.15;
  uv.y = (uv.y - 0.5) / max(vScale, 0.0012) + 0.5;
  uv.x = (uv.x - 0.5) / max(hScale, 0.0012) + 0.5;

  // Curved glass.
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  uv = 0.5 + c * (1.0 + 0.085 * r2 + 0.045 * r2 * r2);

  // Horizontal tear bands. Amplitude is driven by uGlitch, which is
  // event-based - so resting text stays perfectly legible.
  float row  = floor(uv.y * 34.0);
  float band = step(0.985 - uGlitch * 0.12, hash1(row + floor(uTime * 13.0)));
  uv.x += band * (hash1(row * 3.7 + uTime) - 0.5) * 0.085 * uGlitch;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Chromatic aberration: baseline + scroll velocity + glitch, worse at the edge.
  float ab = (0.0013 + abs(uVel) * 0.55 + uGlitch * 0.010) * (0.45 + r2 * 2.2);
  vec3 col = vec3(
    texture2D(tDiffuse, uv + vec2(ab, 0.0)).r,
    texture2D(tDiffuse, uv).g,
    texture2D(tDiffuse, uv - vec2(ab, 0.0)).b
  );

  if (uLow < 0.5) {
    col *= 0.80 + 0.20 * sin(uv.y * uRes.y * 1.55);          // scanlines
    float m = mod(gl_FragCoord.x, 3.0);                       // aperture grille
    col *= vec3(m < 1.0 ? 1.12 : 0.90,
                (m >= 1.0 && m < 2.0) ? 1.12 : 0.90,
                m >= 2.0 ? 1.12 : 0.90);
    col += 0.030 * smoothstep(0.90, 1.0, sin(uv.y * 3.0 - uTime * 0.55)); // refresh bar
    col += (hash(uv * uRes + uTime * 60.0) - 0.5) * 0.055;    // phosphor noise
  } else {
    col *= 0.86 + 0.14 * sin(uv.y * uRes.y * 1.55);
  }

  col *= vec3(1.06, 0.94, 0.70);        // P3 amber bias
  col *= 1.0 - r2 * 0.85;               // vignette
  col += vec3(0.030, 0.020, 0.010);     // the tube is never truly black

  col += vec3(1.0, 0.92, 0.78) * (1.0 - smoothstep(0.0, 0.35, pw)) * (1.0 - pw) * 1.4;
  col *= step(0.0015, pw);

  gl_FragColor = vec4(col, 1.0);
}`;