import type { Project } from "./types";

/**
 * Everything you need to change to make this yours lives in this file
 * plus the JSX in components/Panels.tsx.
 */
export const CONFIG = {
  name: "RIZALDY IMAN PUTRA",
  /** Two lines for the boot headline. Three would overflow on mobile. */
  nameLines: ["RIZALDY", "IMAN PUTRA"],
  role: "Full Stack Developer",
  email: "rizaldyimanputra@gmail.com",
  github: "github.com/rizaldyip10",
  githubUrl: "https://github.com/rizaldyip10",
  /** VERIFY: your CV and the earlier draft disagree on this slug. */
  linkedin: "linkedin.com/in/rizaldy-imanputra-a17b0317a",
  linkedinUrl: "https://www.linkedin.com/in/rizaldy-imanputra-a17b0317a/",
  /** Put the PDF in /public and point this at /Rizaldy_Iman_Putra.pdf */
  resumeUrl: "#",

  projects: [
    { title: "LYDHH LAW", tag: "CORPORATE WEB", seed: 0 },
    { title: "INVOICING", tag: "BILLING BACKEND", seed: 14 },
    { title: "JOB PORTAL", tag: "MICROSERVICES", seed: -10 },
    { title: "STAYEASE", tag: "PROPERTY RENTAL", seed: 6 },
  ] satisfies Project[],

  /** Only tools that appear on the CV. Adding others is the same
   *  credibility problem as inventing metrics. */
  skills: [
    "TYPESCRIPT", "JAVASCRIPT", "JAVA", "SOLIDITY",
    "REACT", "NEXT.JS", "NEST.JS", "SPRING BOOT",
    "POSTGRESQL", "MONGODB", "REDIS", "DOCKER",
    "GCP", "AWS", "GRAPHQL", "GRPC",
    "PRISMA", "TAILWIND",
  ],
} as const;

/** Scene tuning. Change these to retime the whole experience. */
export const SCENE = {
  /** Total page height. 7 screens of scroll. */
  scrollVh: 700,
  /** World units the camera travels across the full scroll. */
  depth: 400,
  /** How far ahead of the camera content is placed when it's "on screen". */
  lead: 40,
  /** Scroll progress at which each project card sits directly ahead. */
  projectAnchors: [0.315, 0.435, 0.555, 0.675],
  whoamiAnchor: 0.175,
  /** Push the scope trace off the text column. x/y are world units.
   *  It used to sit dead centre, behind the longest copy on the site. */
  whoamiOffset: { x: 10, y: 4.5 },
  whoamiOffsetNarrow: { x: 4, y: 9.5 },
  /** Trace brightness. Below ~0.7 it stops competing with body text. */
  whoamiBeam: 0.6,
  stackAnchor: 0.805,
  /** Lenis reports px/frame; scale it into the range the shader expects. */
  velocityScale: 0.0075,
  /** Cap device pixel ratio. The CRT pass is fill-rate bound, not vertex bound. */
  maxDpr: 1.5,
  maxDprLowFx: 1,
} as const;