import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Info, Shield, Sparkles, Github, Chrome } from "lucide-react";



// --- Lightweight hash router ---
type RouteSetter = (r: string) => void;
type UseRouteReturn = readonly [string, RouteSetter];

function useRoute(): UseRouteReturn {
  const [route, setRoute] = useState<string>(
    () => window.location.hash.replace("#", "") || "/"
  );

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate: RouteSetter = (r) => {
    window.location.hash = r;
  };

  // Either of these is fine (pick one):
  return [route, navigate] as const;                     // option A
  // return [route, navigate] satisfies UseRouteReturn;  // option B (TS 4.9+)
}


function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  type Particle = { x: number; y: number; vx: number; vy: number };
  const particles = useRef<Particle[]>([]);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const config = useMemo(
    () => ({
      count: 120,
      linkDist: 140,
      radius: 1.8,
      speed: 0.3,
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
    };

    const resetParticles = () => {
      particles.current = Array.from({ length: config.count }, (): Particle => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "rgba(99,102,241,0.10)");
      grad.addColorStop(1, "rgba(236,72,153,0.08)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const ps = particles.current;

      // update positions
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      // draw links
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < config.linkDist * window.devicePixelRatio) {
            const a = 1 - dist / (config.linkDist * window.devicePixelRatio);
            ctx.strokeStyle = `rgba(255,255,255,${0.25 * a})`;
            ctx.lineWidth = 1 * window.devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.stroke();
          }
        }
      }

      // draw particles (mouse attraction)
      for (const p of ps) {
        const dx = (mouse.current.x - p.x) * 0.0008;
        const dy = (mouse.current.y - p.y) * 0.0008;
        p.vx += dx;
        p.vy += dy;
        const len = Math.hypot(p.vx, p.vy);
        const max = config.speed * 2;
        if (len > max) {
          p.vx = (p.vx / len) * max;
          p.vy = (p.vy / len) * max;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, config.radius * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = (e.clientX - rect.left) * window.devicePixelRatio;
      mouse.current.y = (e.clientY - rect.top) * window.devicePixelRatio;
    };

    resize();
    resetParticles();
    draw();

    window.addEventListener("resize", () => {
      resize();
      resetParticles();
    });
    window.addEventListener("mousemove", onMouse);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [config]);

  return <canvas ref={canvasRef} className="absolute inset-0 -z-10 h-full w-full rounded-2xl" />;
}


// --- Shared layout ---
function Shell({ children, routeTo }: { children: React.ReactNode; routeTo: (r: string) => void }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => routeTo('/')}> 
            <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-500" />
            <span className="font-semibold tracking-tight">Sentinel</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" className="text-sm" onClick={() => routeTo('/')}>Home</Button>
            <Button variant="ghost" className="text-sm" onClick={() => routeTo('/about')}>About</Button>
            <Button className="text-sm" onClick={() => routeTo('/download')}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-sm text-neutral-400">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Sentinel – Open Source Moderation for a Safer Web.</p>
          <div className="flex items-center gap-3">
            <a className="inline-flex items-center gap-2 hover:text-white" href="https://github.com/" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4"/> GitHub
            </a>
            <a className="inline-flex items-center gap-2 hover:text-white" href="#/download">
              <Chrome className="h-4 w-4"/> Chrome Extension
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Pages ---
function Home({ routeTo }: { routeTo: (r: string) => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 p-8 md:p-12">
      <ParticleField />
      <div className="relative z-10">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-semibold tracking-tight">
          Crowd‑rated. Cryptographically trusted.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-4 text-neutral-300 text-lg md:text-xl max-w-2xl">
          Sentinel is a community extension that helps you see reputation scores and safety signals while you browse—without giving up privacy.
        </motion.p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => routeTo('/download')}>
            <Download className="mr-2 h-5 w-5"/> Get the Chrome Extension
          </Button>
          <Button size="lg" variant="secondary" onClick={() => routeTo('/about')}>
            <Info className="mr-2 h-5 w-5"/> How it works
          </Button>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[{
            icon: <Shield className="h-5 w-5"/>,
            title: 'Signed Ratings',
            text: 'Each rating is linked to a public key—tamper‑evident and auditable.'
          },{
            icon: <Sparkles className="h-5 w-5"/>,
            title: 'Live Scores',
            text: 'See site‑level trust and category signals instantly on page load.'
          },{
            icon: <Info className="h-5 w-5"/>,
            title: 'Privacy‑first',
            text: 'No browsing history collection. All signals computed from public data.'
          }].map((f, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-xl p-2 bg-white/10">{f.icon}</div>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">{f.text}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const steps = [
    { title: 'Rate what you see', desc: 'Quick‑rate a site with our Chrome popup: categories, 1–5 score, and an optional note.' },
    { title: 'Sign & submit', desc: 'Your browser signs the review with your keypair. The server stores the signature and hash—not your identity.' },
    { title: 'Aggregate & verify', desc: 'Scores are aggregated per‑domain with transparent math and auditable data.' },
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 p-8">
        <ParticleField />
        <div className="relative z-10">
          <h2 className="text-3xl font-semibold tracking-tight">What is Sentinel?</h2>
          <p className="mt-4 text-neutral-300">
            Sentinel is an open‑source effort from UCL Engineering students to make reputation and safety visible on the open web. It combines lightweight cryptography with a simple, fast user experience.
          </p>
          <div className="mt-6 grid gap-3">
            {steps.map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-neutral-400">Step {i + 1}</div>
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-neutral-300">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 p-8">
        <h3 className="text-xl font-semibold">Tech highlights</h3>
        <ul className="mt-4 space-y-2 text-neutral-300 text-sm">
          <li>• Type‑safe JSON schema for reviews (domain, score, categories, signature).</li>
          <li>• Public/private keypairs per user; signatures verified in the API.</li>
          <li>• Supabase/Postgres storage with transparent aggregation views.</li>
          <li>• Browser extension shows live per‑domain score badge.</li>
          <li>• Privacy‑preserving design: no personal data, auditable records.</li>
        </ul>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <a href="#/download"><Download className="mr-2 h-4 w-4"/> Download</a>
          </Button>
          <Button variant="secondary" asChild>
            <a href="https://github.com/" target="_blank" rel="noreferrer"><Github className="mr-2 h-4 w-4"/> View on GitHub</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function DownloadPage() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 p-8 md:p-12">
      <ParticleField />
      <div className="relative z-10">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Download Sentinel</h2>
        <p className="mt-3 text-neutral-300 max-w-2xl">
          Install the Chrome extension and start seeing safety signals on the web. Firefox & Edge support are planned.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* TODO: Replace with your actual Chrome Web Store URL */}
          <Button size="lg" asChild>
            <a href="https://chromewebstore.google.com/" target="_blank" rel="noreferrer">
              <Chrome className="mr-2 h-5 w-5"/> Add to Chrome
            </a>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="/sentinel-latest.crx" download>
              <Download className="mr-2 h-5 w-5"/> Download .crx
            </a>
          </Button>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[{
            title: '1. Install',
            text: 'Click “Add to Chrome” and confirm permissions.'
          },{
            title: '2. Pin it',
            text: 'Pin Sentinel to your toolbar to see scores at a glance.'
          },{
            title: '3. Rate',
            text: 'Open the popup on any site to submit a quick rating.'
          }].map((s, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">{s.text}</CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-sm text-neutral-400">
          <p>
            Developer install: go to <span className="text-white">chrome://extensions</span>, enable <span className="text-white">Developer mode</span>,
            then <span className="text-white">Load unpacked</span> and select the <span className="text-white">/extension</span> folder from the repo.
          </p>
        </div>
      </div>
    </section>
  );
}

// --- App ---
export default function App() {
  const [route, routeTo] = useRoute();
  let page: React.ReactNode = null;
  if (route === '/about') page = <About />;
  else if (route === '/download') page = <DownloadPage />;
  else page = <Home routeTo={routeTo} />;

  return <Shell routeTo={routeTo}>{page}</Shell>;
}
