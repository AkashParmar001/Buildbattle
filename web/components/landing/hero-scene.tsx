"use client";

import {
  Camera,
  Geometry,
  Mesh,
  Program,
  Renderer,
  Transform,
  Vec2,
} from "ogl";
import { useEffect, useRef } from "react";

type HeroCluster = { label: string; volume: number; share: number };

const VERTEX = /* glsl */ `
precision highp float;

attribute vec3 aTarget;
attribute vec3 aColor;
attribute float aSize;

uniform float uTime;
uniform float uScroll;
uniform float uPixelRatio;
uniform vec2 uMouse;

varying vec3 vColor;

void main() {
  vColor = aColor;

  // Two layouts: scattered cloud (uScroll=0) → clustered constellation (1).
  float t = smoothstep(0.0, 0.7, uScroll);
  vec3 pos = mix(position, aTarget, t);

  // Gentle drift while scattered; settled once clustered.
  float drift = 1.0 - t;
  pos.x += sin(uTime * 0.6 + position.y * 3.1) * 0.07 * drift;
  pos.y += cos(uTime * 0.5 + position.x * 2.7) * 0.07 * drift;

  // Cursor parallax fades as clusters lock in.
  pos.xy += uMouse * 0.22 * (1.0 - t);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (5.2 / -mv.z);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

varying vec3 vColor;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float a = smoothstep(0.5, 0.12, d);
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

// Builds scatter + cluster-target positions for N points from the real
// cluster shares. Colors follow the sentiment mix proportions.
function buildData(count: number, clusters: HeroCluster[], posMix: [number, number, number]) {
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const stone = [0.545, 0.525, 0.482]; // #8B867B
  const ink = [0.047, 0.047, 0.043]; // #0C0C0B
  const positive = [0.365, 0.839, 0.635]; // #5DD6A2
  const negative = [1.0, 0.353, 0.306]; // #FF5A4E
  const palette = [positive, stone, negative];

  const totalShare = clusters.reduce((s, c) => s + c.share, 0) || 1;

  let ci = 0;
  let used = 0;
  for (let i = 0; i < count; i++) {
    // Assign points to clusters by share weight.
    while (
      ci < clusters.length - 1 &&
      i >= Math.round(((used + clusters[ci].share) / totalShare) * count)
    ) {
      used += clusters[ci].share;
      ci++;
    }
    const angle = (i / count) * Math.PI * 2 + ci * 0.7;
    const ring = 1.15 + (ci % 3) * 0.28;

    // Target: constellation ring per cluster, jittered inside a disc.
    const jr = Math.sqrt(Math.random()) * 0.34;
    const ja = Math.random() * Math.PI * 2;
    targets[i * 3] = Math.cos(angle) * ring + Math.cos(ja) * jr;
    targets[i * 3 + 1] = Math.sin(angle) * ring * 0.62 + Math.sin(ja) * jr;
    targets[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

    // Scatter: loose sphere.
    const sr = 0.6 + Math.random() * 1.9;
    const sa = Math.random() * Math.PI * 2;
    const sb = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = Math.sin(sb) * Math.cos(sa) * sr;
    positions[i * 3 + 1] = Math.sin(sb) * Math.sin(sa) * sr * 0.7;
    positions[i * 3 + 2] = Math.cos(sb) * sr * 0.5;

    // Sentiment-weighted color; remainder alternates ink/stone.
    const roll = Math.random();
    let c;
    if (roll < posMix[0]) c = palette[0];
    else if (roll < posMix[0] + posMix[1]) c = palette[1];
    else if (roll < posMix[0] + posMix[1] + posMix[2]) c = palette[2];
    else c = Math.random() > 0.5 ? ink : stone;
    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];

    sizes[i] = 6 + Math.random() * 10 + (i % 7 === 0 ? 6 : 0);
  }

  return { positions, targets, colors, sizes };
}

// WebGL point-cloud hero (ogl): ≤600 points, DPR capped at 2, cursor
// parallax, scattered cloud that locks into cluster rings as you scroll.
// Static gradient fallback on coarse pointers, small screens and reduced
// motion; paused via IntersectionObserver when offscreen.
export function HeroScene({
  clusters,
  sentimentMix,
}: {
  clusters: HeroCluster[];
  sentimentMix: { sentiment: string; share: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.innerWidth < 768;
    if (reduce || coarse || small) return; // fallback gradient stays visible

    const mixOf = (s: string) =>
      sentimentMix.find((m) => m.sentiment === s)?.share ?? 0;
    const posMix: [number, number, number] = [
      mixOf("positive"),
      mixOf("neutral"),
      mixOf("negative"),
    ];

    const renderer = new Renderer({
      canvas,
      alpha: true,
      dpr: Math.min(window.devicePixelRatio, 2),
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.set(0, 0, 5.2);

    const scene = new Transform();

    const COUNT = Math.min(600, Math.max(240, clusters.length * 48));
    const { positions, targets, colors, sizes } = buildData(
      COUNT,
      clusters,
      posMix,
    );

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      aTarget: { size: 3, data: targets },
      aColor: { size: 3, data: colors },
      aSize: { size: 1, data: sizes },
    });

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      transparent: true,
      depthTest: false,
    });
    program.uniforms.uScroll = 0;
    program.uniforms.uMouse = new Vec2(0, 0);
    program.uniforms.uPixelRatio = renderer.dpr;

    const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });
    mesh.setParent(scene);

    // Layout
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / Math.max(h, 1) });
    };
    resize();
    window.addEventListener("resize", resize);

    // Cursor → parallax (normalized -0.5..0.5).
    const mouse = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width - 0.5;
      mouse.y = 0.5 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Scroll progress across the first viewport → cluster lock-in.
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      program.uniforms.uScroll = p;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Pause when offscreen.
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      program.uniforms.uTime = (now - start) / 1000;
      // Ease mouse for lag-free parallax.
      const m = program.uniforms.uMouse as unknown as Vec2;
      m.x += (mouse.x - m.x) * 0.06;
      m.y += (mouse.y - m.y) * 0.06;
      renderer.render({ scene, camera });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      // OGL has no destroy(); free GL objects manually.
      for (const attr of Object.values(geometry.attributes)) {
        const buf = (attr as { buffer?: WebGLBuffer }).buffer;
        if (buf) gl.deleteBuffer(buf);
      }
      const prog = (program as unknown as { program?: WebGLProgram }).program;
      if (prog) gl.deleteProgram(prog);
    };
  }, [clusters, sentimentMix]);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      {/* Static gradient fallback (always painted underneath the canvas). */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,color-mix(in_srgb,var(--stone)_28%,transparent),transparent_65%),radial-gradient(ellipse_at_30%_70%,color-mix(in_srgb,var(--hairline)_35%,transparent),transparent_60%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
