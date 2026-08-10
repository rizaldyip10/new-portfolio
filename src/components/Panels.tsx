import { CONFIG } from "../config";
import { PANELS } from "../scroll/panels";

type Register = (id: string, el: HTMLElement | null) => void;

/**
 * All copy lives here as real DOM. It is crawlable, selectable and readable
 * by a screen reader; the WebGL layer behind it is decoration only.
 * Opacity and transform are driven imperatively by useScrollEngine.
 *
 * RULE FOR EDITING: every claim below is traceable to the CV. If you add a
 * number, it must be one you can defend in an interview.
 */
export function Panels({ register }: { register: Register }) {
  const ref = (id: string) => (el: HTMLElement | null) => register(id, el);
  const addr = (id: string) => PANELS.find((p) => p.id === id)?.addr ?? "";

  return (
    <main id="overlay">
      <section className="panel boot" ref={ref("boot")} aria-labelledby="name-h">
        <pre className="bootlog">{`[ OK ]  portfolio mounted
$ ./whoami --verbose`}</pre>
        <p className="marker">{addr("boot")} · BOOT</p>
        <h1 id="name-h">
          {CONFIG.nameLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </h1>
        <p className="sub">{CONFIG.role}</p>
        <p className="hint">scroll to run</p>
      </section>

      <section className="panel" ref={ref("whoami")}>
        <p className="marker">{addr("whoami")} · WHOAMI</p>
        <h2>
          Aerospace first.
          <br />
          Then software.
        </h2>
        <p>
          I studied aerospace engineering at ITB and wrote my thesis on computer
          vision for detecting social-distancing violations in airports. The
          software half took over.
        </p>
        <p>
          Since 2023 I've built <strong>full-stack systems end to end</strong> —
          TypeScript and Next.js at the front, Java Spring Boot and PostgreSQL
          behind it. Now reading for a Master's in Software Engineering at
          Universiti Teknologi Malaysia.
        </p>
        <p className="meta">Jakarta · Kuala Lumpur · Open to remote</p>
      </section>

      <section className="panel proj" ref={ref("project-1")}>
        <p className="marker">{addr("project-1")} · PROJECT 1 / 4</p>
        <p className="stack">Next.js · TypeScript · Sanity.io</p>
        <h2>LYDHH Law Firm</h2>
        <p>
          Company site for Luthfi Yazid &amp; DHH, built for people who are
          already stressed when they arrive — a law firm's visitors are rarely
          browsing for fun. Content model in Sanity so the firm edits its own
          pages; contact flow through React Hook Form, Zod and Resend.
        </p>
        <p className="result">
          Live at{" "}
          <a href="https://www.lydhhlawfirm.com" target="_blank" rel="noopener noreferrer">
            lydhhlawfirm.com
          </a>
          . I also handled the domain, corporate email and hosting — not just the
          front end.
        </p>
      </section>

      <section className="panel proj" ref={ref("project-2")}>
        <p className="marker">{addr("project-2")} · PROJECT 2 / 4</p>
        <p className="stack">Java · Spring Boot · PostgreSQL</p>
        <h2>Invoicing Platform</h2>
        <p>
          Backend and dashboard for an Apper Studio client who was tracking
          customer payment status by hand. Schema versioned with Flyway so
          migrations stay reviewable, containerised with Google JIB, and a
          dashboard that shows payment state without anyone opening a spreadsheet.
        </p>
        <p className="result">
          Query paths reworked where the dashboard was doing the most reading.
        </p>
      </section>

      <section className="panel proj" ref={ref("project-3")}>
        <p className="marker">{addr("project-3")} · PROJECT 3 / 4</p>
        <p className="stack">Spring Cloud · Docker · React</p>
        <h2>Hospitality Job Portal</h2>
        <p>
          Job platform for hospitality workers, built as microservices rather
          than a monolith: Spring Cloud with Eureka for service discovery,
          Dockerised, PostgreSQL and MongoDB side by side, Doku payment gateway
          and JWT auth. Front end in React with TanStack Router and Query.
        </p>
        <p className="result">
          The interesting problem was service boundaries — deciding what
          genuinely needed to be its own service and what didn't.
        </p>
      </section>

      <section className="panel proj" ref={ref("project-4")}>
        <p className="marker">{addr("project-4")} · PROJECT 4 / 4</p>
        <p className="stack">Next.js · Spring Boot · Redis · GCP</p>
        <h2>StayEase</h2>
        <p>
          Property rental platform — search, booking, payments — built by two
          people. Midtrans for payment, Google Maps for location, Cloudinary for
          images, Redis in front of the read paths, deployed on GCP.
        </p>
        <p className="result">
          Live at{" "}
          <a
            href="https://stayeasewithus.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            stayeasewithus.vercel.app
          </a>
          .
        </p>
      </section>

      <section className="panel skills" ref={ref("skills")}>
        <p className="marker">{addr("skills")} · STACK</p>
        <h2>
          What I reach
          <br />
          for first.
        </h2>
        <ul>
          {CONFIG.skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="meta">
          Also worked with · MySQL, TypeORM, Sequelize, gRPC, Jira, Katalon,
          TestLink
        </p>
      </section>

      <section className="panel contact" ref={ref("contact")} id="contact">
        <p className="marker">{addr("contact")} · EOF</p>
        <h2 className="prompt">$ ./contact</h2>
        <div className="lines">
          <div>
            <span>mail</span>
            <a href={`mailto:${CONFIG.email}`}>{CONFIG.email}</a>
          </div>
          <div>
            <span>code</span>
            <a href={CONFIG.githubUrl} target="_blank" rel="noopener noreferrer">
              {CONFIG.github}
            </a>
          </div>
          <div>
            <span>work</span>
            <a href={CONFIG.linkedinUrl} target="_blank" rel="noopener noreferrer">
              {CONFIG.linkedin}
            </a>
          </div>
          <div>
            <span>docs</span>
            <a href={CONFIG.resumeUrl}>Résumé — PDF</a>
          </div>
        </div>
        <p className="eof">
          Indonesian · English (IELTS 6.5) · 日本語 (JLPT N3)
        </p>
      </section>
    </main>
  );
}