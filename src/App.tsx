import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "katex/dist/katex.min.css";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  BrainCircuit,
  ChevronRight,
  Database,
  FileText,
  Menu,
  Network,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { CompanionAnnotation, CompanionComponents, CompanionMethod, CompanionSimulations } from "./Companion";

type DomainKey = "cbt" | "p4g";

const paperHref = "./TOPAS_ICLR.pdf";
const artifactHref = "https://anonymous.4open.science/r/TOPA-30B2/";

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

const navigationLinks = [
  ["Overview", "#overview"],
  ["Extraction", "#extraction"],
  ["Annotation", "#annotation"],
  ["Offline RL", "#rl"],
  ["Results", "#results"],
] as const;

// The phase cards and their interactive examples belong to the same chapters.
const navigationTargets = [
  ["overview", "#overview"],
  ["method", "#extraction"],
  ["extraction", "#extraction"],
  ["annotation", "#annotation"],
  ["rl", "#rl"],
  ["components", "#extraction"],
  ["explorer", "#annotation"],
  ["sessions", "#rl"],
  ["results", "#results"],
] as const;

function Header() {
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("#overview");

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      const readingLine = (document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 72) + 24;
      let nearestTop = -Infinity;
      let currentHrefs: string[] = ["#overview"];
      for (const [id, href] of navigationTargets) {
        const section = document.getElementById(id);
        if (!section) continue;
        const top = section.getBoundingClientRect().top;
        if (top > readingLine) continue;
        if (top > nearestTop + 1) {
          nearestTop = top;
          currentHrefs = [href];
        } else if (Math.abs(top - nearestTop) <= 1) {
          currentHrefs.push(href);
        }
      }
      // On desktop the three phase cards share a row: retain the selected link.
      setActiveHref((previous) => currentHrefs.includes(window.location.hash)
        ? window.location.hash
        : currentHrefs.includes(previous) ? previous : currentHrefs[0]);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveSection);
    };
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.body);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    updateActiveSection();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, []);

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="TOPAS home">
        <Mark />
        <span>TOPAS</span>
      </a>
      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-label="Toggle navigation"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav className={open ? "site-nav site-nav--open" : "site-nav"} aria-label="Primary navigation">
        {navigationLinks.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className={activeHref === href ? "nav-link--active" : undefined}
            aria-current={activeHref === href ? "location" : undefined}
            onClick={() => { setActiveHref(href); setOpen(false); }}
          >
            {label}
          </a>
        ))}
        <a className="nav-paper" href={paperHref} target="_blank" rel="noreferrer">
          Paper <ArrowUpRight size={15} />
        </a>
      </nav>
    </header>
  );
}

const blueprintContent = {
  planner: {
    kicker: "Hierarchical planner",
    title: "Plans in a structured decision space",
    text: "An option policy selects a long-term strategy, an intra-option policy chooses the next primitive action, and a termination function decides when to move on.",
  },
  memory: {
    kicker: "Graph memory",
    title: "Retrieves context across the conversation",
    text: "An extracted ontology organizes persistent user facts and dialogue evidence. The retriever selects relevant graph triples for the current decision.",
  },
  simulator: {
    kicker: "User simulator",
    title: "Keeps evaluation grounded in a profile",
    text: "A structured user state and profile constrain simulated responses, enabling long-horizon evaluation across diverse, consistent users.",
  },
};

type BlueprintKey = keyof typeof blueprintContent;

function Blueprint() {
  const [active, setActive] = useState<BlueprintKey>("planner");
  const item = blueprintContent[active];

  return (
    <div className="blueprint" aria-label="Interactive TOPAS system blueprint">
      <div className="blueprint-head">
        <span>System blueprint</span>
      </div>
      <div className="blueprint-stage">
        <div className="source-stack">
          <div className="source-card"><BookOpenText size={18} /><span>Instructional<br />textbooks</span></div>
          <div className="source-card"><Database size={18} /><span>Unlabeled<br />dialogues</span></div>
        </div>
        <div className="flow-arrow" aria-hidden="true"><ArrowRight /></div>
        <div className="topas-core">
          <Mark />
          <strong>TOPAS</strong>
          <span>compile</span>
        </div>
        <div className="flow-arrow" aria-hidden="true"><ArrowRight /></div>
        <div className="module-stack">
          <button className={active === "planner" ? "module-card active" : "module-card"} onClick={() => setActive("planner")}>
            <Route size={19} /><span>Planner</span><small>state · action · reward</small>
          </button>
          <button className={active === "memory" ? "module-card active" : "module-card"} onClick={() => setActive("memory")}>
            <Network size={19} /><span>Memory</span><small>graph · retrieval</small>
          </button>
          <button className={active === "simulator" ? "module-card active" : "module-card"} onClick={() => setActive("simulator")}>
            <BrainCircuit size={19} /><span>Simulator</span><small>profile · user state</small>
          </button>
        </div>
      </div>
      <div className="blueprint-detail" key={active}>
        <span>{item.kicker}</span>
        <strong>{item.title}</strong>
        <p>{item.text}</p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <main id="top">
      <section className="hero" id="overview">
        <div className="hero-glow hero-glow--one" />
        <div className="hero-glow hero-glow--two" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span /> ICLR 2027 submission · Project page</div>
            <h1>From textbooks to <em>proactive</em> agentic systems.</h1>
            <p className="hero-lede">
              TOPAS automatically turns instructional domain knowledge into a hierarchical planner,
              graph-structured memory, and user simulator—then learns proactive dialogue policies from real interactions.
            </p>
            <div className="hero-actions">
              <a className="button button--coral" href="#explorer">
                Explore an annotated session <ArrowDown size={17} />
              </a>
              <a className="button button--ghost-light" href={paperHref} target="_blank" rel="noreferrer">
                <FileText size={17} /> Read the paper
              </a>
            </div>
            <div className="hero-meta" aria-label="Headline paper results">
              <div><strong>+23.5%</strong><span>CBT average SSR</span></div>
              <div><strong>+15.5%</strong><span>P4G average SSR</span></div>
              <div><strong>99.7%</strong><span>fewer trainable parameters</span></div>
            </div>
          </div>
          <Blueprint />
        </div>
      </section>
    </main>
  );
}

function SectionIntro({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="section-intro" data-reveal>
      <div className="section-label"><span>{label}</span></div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

const pageChapters = [
  { number: "01", title: "Overview", description: "See the complete system at a glance.", href: "#overview", detail: "System" },
  { number: "02", title: "Extraction", description: "Build a domain prior from textbooks.", href: "#extraction", detail: "Phase one" },
  { number: "03", title: "Annotation", description: "Turn dialogues into training trajectories.", href: "#annotation", detail: "Phase two" },
  { number: "04", title: "Offline RL", description: "Learn the hierarchical planner.", href: "#rl", detail: "Phase three" },
  { number: "05", title: "Results", description: "Explore the reported findings.", href: "#results", detail: "Evaluation" },
];

function PageIndex() {
  return (
    <nav className="page-index section-shell section-shell--wide" id="contents" aria-label="On this page">
      <div className="page-index__intro"><span className="mini-label">On this page</span><h2>Explore the paper.</h2></div>
      <div className="page-index__links">
        {pageChapters.map((chapter) => <a href={chapter.href} key={chapter.href}>
          <span>{chapter.number} · {chapter.detail}</span><strong>{chapter.title}</strong><p>{chapter.description}</p><ArrowRight size={16} aria-hidden="true" />
        </a>)}
      </div>
    </nav>
  );
}

const simulatorScores = [
  { metric: "Coherence", values: [4.13, 4.71, 4.83], stds: [0.12, 0.25, 0.00] },
  { metric: "Disclosure", values: [4.18, 3.91, 4.33], stds: [0.14, 0.22, 0.00] },
  { metric: "Resistance", values: [3.53, 4.22, 3.71], stds: [0.05, 0.30, 0.21] },
  { metric: "Emotion", values: [4.62, 4.02, 4.71], stds: [0.14, 0.33, 0.22] },
  { metric: "Realism", values: [4.56, 4.29, 4.58], stds: [0.06, 0.33, 0.13] },
  { metric: "Overall", values: [4.20, 4.23, 4.43], stds: [null, null, null] },
];

const simulatorMethods = ["Patient-Ψ", "PatientAct", "TOPAS"];

const ablationScores = [
  { label: "TOPAS · full", value: 4.78, tone: "full", values: [[6.00, 0.00], [4.27, 0.65], [4.05, 0.60]] },
  { label: "No textbooks · expert", value: 4.97, tone: "expert", values: [[6.00, 0.00], [4.00, 0.54], [4.91, 0.72]] },
  { label: "No textbooks · ChatGPT", value: 4.29, tone: "base", values: [[6.00, 0.00], [3.07, 0.18], [3.80, 0.41]] },
  { label: "Last layer only", value: 4.52, tone: "base", values: [[6.00, 0.00], [3.49, 0.98], [4.07, 0.85]] },
  { label: "No conversation states", value: 3.84, tone: "base", values: [[5.04, 0.33], [3.22, 0.73], [3.25, 0.32]] },
  { label: "No reinforcement learning", value: 2.88, tone: "base", values: [[3.76, 1.07], [2.67, 1.09], [2.20, 0.65]] },
];

const plannerFullResults = {
  cbt: {
    title: "Cognitive behavioral therapy",
    max: 6,
    settings: [
      { simulator: "Patient-Ψ", judge: "GPT-4.1" },
      { simulator: "Patient-Ψ", judge: "DeepSeek" },
      { simulator: "Patient-Ψ", judge: "GPT-5.1" },
      { simulator: "PatientAct", judge: "GPT-4.1" },
      { simulator: "PatientAct", judge: "DeepSeek" },
      { simulator: "PatientAct", judge: "GPT-5.1" },
    ],
    methods: [
      { name: "ProCOT", avg: 1.51, values: [[3.13, 0.87], [0.92, 0.31], [1.70, 0.45], [2.00, 0.18], [0.40, 0.08], [0.90, 0.09]] },
      { name: "TheraMind", avg: 2.24, values: [[4.32, 0.79], [1.79, 0.33], [2.19, 0.47], [2.67, 0.16], [1.07, 0.21], [1.41, 0.16]] },
      { name: "ARIA", avg: 1.52, values: [[3.17, 0.35], [1.48, 0.33], [1.94, 0.11], [1.39, 0.35], [0.49, 0.35], [0.64, 0.30]] },
      { name: "Sweet-RL", avg: 3.06, values: [[5.54, 0.54], [2.47, 0.63], [3.12, 0.43], [3.36, 0.24], [1.76, 0.17], [2.12, 0.20]] },
      { name: "Archer", avg: 2.41, values: [[4.10, 0.76], [2.86, 0.45], [2.87, 0.74], [2.11, 0.67], [1.24, 0.41], [1.29, 0.58]] },
      { name: "TOPAS", avg: 3.78, values: [[5.94, 0.07], [3.69, 0.41], [4.29, 0.23], [3.89, 0.27], [2.19, 0.27], [2.69, 0.12]] },
    ],
  },
  p4g: {
    title: "Persuasion for Good",
    max: 1.5,
    settings: [
      { simulator: "Standard prompting", judge: "GPT-4.1" },
      { simulator: "Standard prompting", judge: "DeepSeek" },
      { simulator: "Standard prompting", judge: "GPT-5.1" },
      { simulator: "TRIP", judge: "GPT-4.1" },
      { simulator: "TRIP", judge: "DeepSeek" },
      { simulator: "TRIP", judge: "GPT-5.1" },
    ],
    methods: [
      { name: "ProCOT", avg: 0.67, values: [[0.99, 0.02], [0.79, 0.07], [1.15, 0.05], [0.30, 0.10], [0.30, 0.10], [0.48, 0.16]] },
      { name: "ARIA", avg: 0.59, values: [[0.79, 0.24], [0.77, 0.20], [0.92, 0.12], [0.38, 0.03], [0.32, 0.03], [0.36, 0.02]] },
      { name: "Sweet-RL", avg: 0.75, values: [[0.92, 0.19], [0.86, 0.37], [1.20, 0.10], [0.40, 0.06], [0.35, 0.00], [0.73, 0.03]] },
      { name: "Archer", avg: 0.84, values: [[1.19, 0.17], [1.16, 0.14], [1.31, 0.05], [0.48, 0.04], [0.40, 0.00], [0.49, 0.10]] },
      { name: "TOPAS", avg: 0.97, values: [[1.30, 0.10], [1.26, 0.06], [1.36, 0.10], [0.57, 0.08], [0.52, 0.08], [0.80, 0.01]] },
    ],
  },
};

const plannerPaletteIndex: Record<string, number> = {
  ProCOT: 0,
  TheraMind: 1,
  ARIA: 2,
  "Sweet-RL": 3,
  Archer: 4,
  TOPAS: 5,
};

function ChartYAxis({ max, ticks }: { max: number; ticks: number[] }) {
  return (
    <div className="chart-y-axis" aria-hidden="true">
      {ticks.map((tick) => <span key={tick} style={{ bottom: `${(tick / max) * 100}%` }}>{tick}</span>)}
    </div>
  );
}

function ChartGridlines({ max, ticks }: { max: number; ticks: number[] }) {
  return <div className="chart-gridlines" aria-hidden="true">{ticks.map((tick) => <span key={tick} style={{ bottom: `${(tick / max) * 100}%` }} />)}</div>;
}

type ChartTooltipInfo = { x: number; y: number; label: string; value: string };

function useChartTooltip() {
  const [tooltip, setTooltip] = useState<ChartTooltipInfo | null>(null);
  const showAtPointer = (event: React.MouseEvent<HTMLButtonElement>, label: string, value: string) => {
    setTooltip({ x: event.clientX, y: event.clientY, label, value });
  };
  const showAtFocus = (event: React.FocusEvent<HTMLButtonElement>, label: string, value: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, label, value });
  };
  return { tooltip, showAtPointer, showAtFocus, hideTooltip: () => setTooltip(null) };
}

function ChartTooltip({ tooltip }: { tooltip: ChartTooltipInfo | null }) {
  if (!tooltip) return null;
  const left = Math.max(12, Math.min(tooltip.x + 16, window.innerWidth - 228));
  const top = Math.max(12, Math.min(tooltip.y - 58, window.innerHeight - 94));
  return createPortal(
    <div className="chart-tooltip" role="status" style={{ left, top }}><span>{tooltip.label}</span><strong>{tooltip.value}</strong></div>,
    document.body,
  );
}

function PlannerResults() {
  const [domain, setDomain] = useState<DomainKey>("cbt");
  const [hoveredMethod, setHoveredMethod] = useState<number | null>(null);
  const [pinnedMethod, setPinnedMethod] = useState<number | null>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const { tooltip, showAtPointer, showAtFocus, hideTooltip } = useChartTooltip();
  const data = plannerFullResults[domain];
  const activeMethod = hoveredMethod ?? pinnedMethod;
  const ticks = domain === "cbt" ? [0, 1, 2, 3, 4, 5, 6] : [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5];
  const barMethodIndex = activeBar === null ? null : activeBar % data.methods.length;
  const emphasizedMethod = barMethodIndex ?? activeMethod;
  const changeDomain = (nextDomain: DomainKey) => {
    setDomain(nextDomain);
    setHoveredMethod(null);
    setPinnedMethod(null);
    setActiveBar(null);
    hideTooltip();
  };
  return (
    <div className="result-panel full-planner" role="tabpanel">
      <div className="visualization-head">
        <div><h3>{data.title}</h3><p>Soft Success Rate by simulator and judge · mean over three runs</p></div>
        <div className="domain-toggle" role="group" aria-label="Planner result domain">
          <button className={domain === "cbt" ? "active" : ""} onClick={() => changeDomain("cbt")}>CBT</button>
          <button className={domain === "p4g" ? "active" : ""} onClick={() => changeDomain("p4g")}>P4G</button>
        </div>
      </div>
      <p className="result-explainer">{domain === "cbt" ? "The CBT comparison now includes TheraMind alongside prompting and RL baselines. Patient-Ψ and PatientAct provide two simulation settings, each evaluated by GPT-4.1, DeepSeek, and GPT-5.1. TOPAS has the highest mean in all six cells; its 3.78 average exceeds the strongest baseline, Sweet-RL at 3.06. TheraMind averages 2.24." : "P4G is evaluated with standard prompting and TRIP simulator settings under the same three judges. TOPAS has the highest mean in all six cells and averages 0.97, compared with 0.84 for the strongest baseline, Archer. The CBT and P4G SSR scales differ, so compare methods within each domain."}</p>
      <div className="planner-legend chart-legend" aria-label="Highlight a planner method">
        {data.methods.map((method, index) => <button type="button" className={`chart-legend-item ${activeMethod === index ? "is-active" : ""} ${activeMethod !== null && activeMethod !== index ? "is-dimmed" : ""}`} key={method.name} aria-pressed={pinnedMethod === index} onMouseEnter={() => { setHoveredMethod(index); setActiveBar(null); hideTooltip(); }} onMouseLeave={() => setHoveredMethod(null)} onFocus={() => { setHoveredMethod(index); setActiveBar(null); hideTooltip(); }} onBlur={() => setHoveredMethod(null)} onClick={() => setPinnedMethod(pinnedMethod === index ? null : index)}><i data-method={plannerPaletteIndex[method.name]} />{method.name}</button>)}
      </div>
      <div className="scaled-chart scaled-chart--planner" role="group" aria-label={`${data.title} Soft Success Rate chart, y axis from 0 to ${data.max}`}>
        <ChartYAxis max={data.max} ticks={ticks} />
        <div className="planner-chart-scroll">
          <div className="planner-chart" style={{ "--planner-max": data.max } as React.CSSProperties}>
            <ChartGridlines max={data.max} ticks={ticks} />
          {data.settings.map((setting, settingIndex) => (
            <div className="planner-cluster" key={`${setting.simulator}-${setting.judge}`}>
              <div className="planner-bars">
                {data.methods.map((method, methodIndex) => {
                  const [mean, std] = method.values[settingIndex];
                  return (
                    <div className="planner-bar-wrap" key={method.name}>
                      <button type="button" className={`planner-bar chart-bar ${activeBar === settingIndex * data.methods.length + methodIndex ? "is-active" : ""} ${(activeBar !== null && activeBar !== settingIndex * data.methods.length + methodIndex) || (activeBar === null && activeMethod !== null && activeMethod !== methodIndex) ? "is-dimmed" : ""}`} data-method={plannerPaletteIndex[method.name]} style={{ height: `${(mean / data.max) * 100}%` }} aria-label={`${method.name}, ${setting.simulator}, ${setting.judge}: ${mean.toFixed(2)} plus or minus ${std.toFixed(2)} Soft Success Rate`} onMouseEnter={(event) => { setActiveBar(settingIndex * data.methods.length + methodIndex); setHoveredMethod(null); showAtPointer(event, `${method.name} · ${setting.simulator} · ${setting.judge}`, mean.toFixed(2)); }} onMouseMove={(event) => showAtPointer(event, `${method.name} · ${setting.simulator} · ${setting.judge}`, mean.toFixed(2))} onMouseLeave={() => { setActiveBar(null); hideTooltip(); }} onFocus={(event) => { setActiveBar(settingIndex * data.methods.length + methodIndex); setHoveredMethod(null); showAtFocus(event, `${method.name} · ${setting.simulator} · ${setting.judge}`, mean.toFixed(2)); }} onBlur={() => { setActiveBar(null); hideTooltip(); }} onClick={() => setActiveBar(settingIndex * data.methods.length + methodIndex)} />
                    </div>
                  );
                })}
              </div>
              <div className="planner-cluster__label"><strong>{setting.simulator}</strong><span>{setting.judge}</span></div>
            </div>
          ))}
          </div>
        </div>
      </div>
      <div className="result-table-wrap">
        <table className="result-table">
          <caption>Complete values · mean ± standard deviation</caption>
          <thead><tr><th>Method</th>{data.settings.map((setting) => <th key={`${setting.simulator}-${setting.judge}`}><span>{setting.simulator}</span>{setting.judge}</th>)}<th>Average</th></tr></thead>
          <tbody>
            {data.methods.map((method, index) => (
              <tr className={`${method.name === "TOPAS" ? "result-table__topas" : ""} ${emphasizedMethod === index ? "result-table__selected" : ""}`} key={method.name}>
                <th>{method.name}</th>
                {method.values.map(([mean, std], index) => <td key={index}>{mean.toFixed(2)} <small>±{std.toFixed(2)}</small></td>)}
                <td><strong>{method.avg.toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="result-explainer result-explainer--after">Bar height shows the mean. The table gives every mean and standard deviation across runs.</p>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function SimulatorResults() {
  const [hoveredMethod, setHoveredMethod] = useState<number | null>(null);
  const [pinnedMethod, setPinnedMethod] = useState<number | null>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const { tooltip, showAtPointer, showAtFocus, hideTooltip } = useChartTooltip();
  const activeMethod = hoveredMethod ?? pinnedMethod;
  const ticks = [0, 1, 2, 3, 4, 5];
  const barMethodIndex = activeBar === null ? null : activeBar % simulatorMethods.length;
  const emphasizedMethod = barMethodIndex ?? activeMethod;
  return (
    <div className="result-panel simulator-chart" role="tabpanel">
      <div className="visualization-head"><div><h3>User-simulator quality</h3><p>Mean LLM-judge ratings by criterion · higher is better</p></div><span>1–5 scale ↑</span></div>
      <p className="result-explainer">A useful patient simulator should do more than cooperate: it must remain coherent, disclose information plausibly, show resistance, express emotion, and stay realistic. TOPAS leads on coherence, disclosure, emotion, and realism; PatientAct has the highest resistance score. Overall means are 4.43 for TOPAS, 4.23 for PatientAct, and 4.20 for Patient-Ψ.</p>
      <div className="simulator-legend chart-legend" aria-label="Highlight a simulator">
        {simulatorMethods.map((method, index) => <button type="button" className={`chart-legend-item ${activeMethod === index ? "is-active" : ""} ${activeMethod !== null && activeMethod !== index ? "is-dimmed" : ""}`} key={method} aria-pressed={pinnedMethod === index} onMouseEnter={() => { setHoveredMethod(index); setActiveBar(null); hideTooltip(); }} onMouseLeave={() => setHoveredMethod(null)} onFocus={() => { setHoveredMethod(index); setActiveBar(null); hideTooltip(); }} onBlur={() => setHoveredMethod(null)} onClick={() => setPinnedMethod(pinnedMethod === index ? null : index)}><i data-series={index} />{method}</button>)}
      </div>
      <div className="scaled-chart scaled-chart--simulator" role="group" aria-label="Simulator ratings chart, y axis from 0 to 5">
        <ChartYAxis max={5} ticks={ticks} />
        <div className="metric-grid">
          <ChartGridlines max={5} ticks={ticks} />
          {simulatorScores.map((row, rowIndex) => (
          <div className={`metric-group ${row.metric === "Overall" ? "metric-group--overall" : ""}`} key={row.metric}>
            <strong>{row.metric}</strong>
            <div className="metric-bars">
              {row.values.map((value, index) => (
                <div className="metric-bar" key={`${row.metric}-${simulatorMethods[index]}`}>
                  <button type="button" className={`chart-bar ${activeBar === rowIndex * simulatorMethods.length + index ? "is-active" : ""} ${(activeBar !== null && activeBar !== rowIndex * simulatorMethods.length + index) || (activeBar === null && activeMethod !== null && activeMethod !== index) ? "is-dimmed" : ""}`} data-series={index} style={{ height: `${(value / 5) * 100}%` }} aria-label={`${simulatorMethods[index]}, ${row.metric}: ${value.toFixed(2)}${row.stds[index] !== null ? ` plus or minus ${row.stds[index]!.toFixed(2)}` : ""} out of 5`} onMouseEnter={(event) => { setActiveBar(rowIndex * simulatorMethods.length + index); setHoveredMethod(null); showAtPointer(event, `${simulatorMethods[index]} · ${row.metric}`, value.toFixed(2)); }} onMouseMove={(event) => showAtPointer(event, `${simulatorMethods[index]} · ${row.metric}`, value.toFixed(2))} onMouseLeave={() => { setActiveBar(null); hideTooltip(); }} onFocus={(event) => { setActiveBar(rowIndex * simulatorMethods.length + index); setHoveredMethod(null); showAtFocus(event, `${simulatorMethods[index]} · ${row.metric}`, value.toFixed(2)); }} onBlur={() => { setActiveBar(null); hideTooltip(); }} onClick={() => setActiveBar(rowIndex * simulatorMethods.length + index)} />
                </div>
              ))}
            </div>
          </div>
          ))}
        </div>
      </div>
      <div className="result-table-wrap result-table-wrap--compact">
        <table className="result-table simulator-result-table">
          <caption>Complete simulator ratings · mean ± standard deviation</caption>
          <thead><tr><th>Metric</th>{simulatorMethods.map((method, index) => <th className={emphasizedMethod === index ? "result-table__selected-cell" : ""} key={method}>{method}</th>)}</tr></thead>
          <tbody>
            {simulatorScores.map((row) => (
              <tr className={row.metric === "Overall" ? "result-table__topas" : ""} key={row.metric}>
                <th>{row.metric}</th>
                {row.values.map((value, index) => <td className={emphasizedMethod === index ? "result-table__selected-cell" : ""} key={simulatorMethods[index]}>{value.toFixed(2)} {row.stds[index] !== null && <small>±{row.stds[index]!.toFixed(2)}</small>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function AblationResults() {
  const judges = ["GPT-4.1", "DeepSeek", "GPT-5.1"];
  const [hoveredVariant, setHoveredVariant] = useState<number | null>(null);
  const [pinnedVariant, setPinnedVariant] = useState<number | null>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const { tooltip, showAtPointer, showAtFocus, hideTooltip } = useChartTooltip();
  const activeVariant = hoveredVariant ?? pinnedVariant;
  const ticks = [0, 1, 2, 3, 4, 5, 6];
  const barVariantIndex = activeBar === null ? null : activeBar % ablationScores.length;
  const emphasizedVariant = barVariantIndex ?? activeVariant;
  return (
    <div className="result-panel ablation-chart" role="tabpanel">
      <div className="visualization-head"><div><h3>What drives performance?</h3><p>Soft Success Rate for every judge across the reported ablations</p></div><span>SSR ↑</span></div>
      <p className="result-explainer">The CBT ablations isolate the role of the extracted prior, selected hidden layer, conversation states, and offline RL. Replacing the textbook prior with expert-designed structure reaches 4.97; the full automatic system reaches 4.78. Removing RL drops the average to 2.88, the largest fall in this comparison.</p>
      <div className="ablation-legend chart-legend" aria-label="Highlight an ablation variant">
        {ablationScores.map((row, index) => <button type="button" className={`chart-legend-item ${activeVariant === index ? "is-active" : ""} ${activeVariant !== null && activeVariant !== index ? "is-dimmed" : ""}`} key={row.label} aria-pressed={pinnedVariant === index} onMouseEnter={() => { setHoveredVariant(index); setActiveBar(null); hideTooltip(); }} onMouseLeave={() => setHoveredVariant(null)} onFocus={() => { setHoveredVariant(index); setActiveBar(null); hideTooltip(); }} onBlur={() => setHoveredVariant(null)} onClick={() => setPinnedVariant(pinnedVariant === index ? null : index)}><i data-ablation={index} />{row.label}</button>)}
      </div>
      <div className="scaled-chart scaled-chart--ablation" role="group" aria-label="Ablation Soft Success Rate chart, y axis from 0 to 6">
        <ChartYAxis max={6} ticks={ticks} />
        <div className="ablation-chart-scroll">
          <div className="ablation-full-chart">
            <ChartGridlines max={6} ticks={ticks} />
            {judges.map((judge, judgeIndex) => (
          <div className="ablation-judge" key={judge}>
            <div className="ablation-judge__bars">
              {ablationScores.map((row, rowIndex) => {
                const [mean, std] = row.values[judgeIndex];
                return <button type="button" key={row.label} className={`chart-bar ${activeBar === judgeIndex * ablationScores.length + rowIndex ? "is-active" : ""} ${(activeBar !== null && activeBar !== judgeIndex * ablationScores.length + rowIndex) || (activeBar === null && activeVariant !== null && activeVariant !== rowIndex) ? "is-dimmed" : ""}`} data-ablation={rowIndex} style={{ height: `${(mean / 6) * 100}%` }} aria-label={`${row.label}, ${judge}: ${mean.toFixed(2)} plus or minus ${std.toFixed(2)} Soft Success Rate`} onMouseEnter={(event) => { setActiveBar(judgeIndex * ablationScores.length + rowIndex); setHoveredVariant(null); showAtPointer(event, `${row.label} · ${judge}`, mean.toFixed(2)); }} onMouseMove={(event) => showAtPointer(event, `${row.label} · ${judge}`, mean.toFixed(2))} onMouseLeave={() => { setActiveBar(null); hideTooltip(); }} onFocus={(event) => { setActiveBar(judgeIndex * ablationScores.length + rowIndex); setHoveredVariant(null); showAtFocus(event, `${row.label} · ${judge}`, mean.toFixed(2)); }} onBlur={() => { setActiveBar(null); hideTooltip(); }} onClick={() => setActiveBar(judgeIndex * ablationScores.length + rowIndex)} />;
              })}
            </div>
            <strong>{judge}</strong>
          </div>
            ))}
          </div>
        </div>
      </div>
      <div className="result-table-wrap result-table-wrap--compact">
        <table className="result-table ablation-result-table">
          <caption>Complete ablation values · mean ± standard deviation</caption>
          <thead><tr><th>Variant</th>{judges.map((judge) => <th key={judge}>{judge}</th>)}<th>Average</th></tr></thead>
          <tbody>{ablationScores.map((row, index) => <tr className={`${row.tone === "full" ? "result-table__topas" : ""} ${emphasizedVariant === index ? "result-table__selected" : ""}`} key={row.label}><th>{row.label}</th>{row.values.map(([mean, std], index) => <td key={judges[index]}>{mean.toFixed(2)} <small>±{std.toFixed(2)}</small></td>)}<td><strong>{row.value.toFixed(2)}</strong></td></tr>)}</tbody>
        </table>
      </div>
      <p className="chart-callout"><ShieldCheck size={16} /> Expert-authored structure can match the full pipeline; removing RL causes the largest drop.</p>
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function ResultsSection() {
  const [view, setView] = useState<"planner" | "simulator" | "ablations">("planner");
  return (
    <section className="section results-section" id="results">
      <div className="section-shell section-shell--wide">
        <SectionIntro
          label="05 · Results"
          title="Better long-horizon control. A much smaller trainable policy."
          text="The evaluation follows the full system: extracted structure, dialogue annotations, simulator fidelity, and learned policies. Compare planner, simulator, and ablation results below."
        />
        <div className="result-highlights" data-reveal>
          <article><span>CBT improvement</span><strong>+23.5%</strong><p>Average SSR over the strongest baseline</p></article>
          <article><span>P4G improvement</span><strong>+15.5%</strong><p>Average SSR over the strongest baseline</p></article>
          <article><span>Efficiency</span><strong>20M</strong><p>Trainable parameters vs. 7.2–7.8B</p></article>
          <article><span>Training</span><strong>up to 7×</strong><p>Faster training in reported experiments</p></article>
        </div>
        <div className="results-context" data-reveal>
          <p>The planner table evaluates cognitive behavioral therapy on the Alexander Street counseling corpus and persuasion on Persuasion for Good. Soft Success Rate uses domain-specific outcome rubrics: CTRS-based ratings for CBT and donation outcomes for P4G. Each setting reports a mean and standard deviation over three runs, making the comparison across simulators and judges visible rather than reducing it to one average.</p>
          <p>TOPAS trains approximately 20 million parameters while keeping the dialogue model frozen, compared with 7.2–7.8 billion trainable parameters for the large RL baselines. Training takes about two hours for TOPAS and six to fourteen hours for those baselines in the reported experiments.</p>
        </div>
        <div className="result-dashboard" data-reveal>
          <div className="result-tabs" role="tablist" aria-label="Result families">
            <button className={view === "planner" ? "active" : ""} onClick={() => setView("planner")} role="tab" aria-selected={view === "planner"}>Planner</button>
            <button className={view === "simulator" ? "active" : ""} onClick={() => setView("simulator")} role="tab" aria-selected={view === "simulator"}>User simulator</button>
            <button className={view === "ablations" ? "active" : ""} onClick={() => setView("ablations")} role="tab" aria-selected={view === "ablations"}>Ablations</button>
          </div>
          {view === "planner" && <PlannerResults />}
          {view === "simulator" && <SimulatorResults />}
          {view === "ablations" && <AblationResults />}
        </div>
      </div>
    </section>
  );
}

function CitationSection() {
  return (
    <section className="citation-section">
      <div className="section-shell">
        <details className="citation-card" data-reveal>
          <summary><span><small>Citation</small>Cite TOPAS</span><ChevronRight size={19} /></summary>
          <div className="bibtex-wrap">
            <p>The submission is anonymous; update author and venue fields when the archival version is available.</p>
            <pre>{`@inproceedings{anonymous2027topas,
  title     = {From Textbooks to Proactive Agentic Systems},
  author    = {Anonymous},
  booktitle = {International Conference on Learning Representations},
  year      = {2027}
}`}</pre>
          </div>
        </details>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-shell" data-reveal>
        <div className="cta-mark"><Mark /></div>
        <span className="mini-label">Read the full work</span>
        <h2>From Textbooks to Proactive Agentic Systems</h2>
        <p>Scaling long-horizon planning via automated agentic system construction.</p>
        <div className="cta-actions">
          <a className="button button--coral" href={paperHref} target="_blank" rel="noreferrer"><FileText size={17} /> Open paper</a>
          <a className="button button--ghost-light" href={artifactHref} target="_blank" rel="noreferrer">Code <ArrowUpRight size={17} /></a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <a className="brand brand--footer" href="#top"><Mark /><span>TOPAS</span></a>
        <p>Textbooks tO Proactive Agentic Systems · ICLR 2027 submission</p>
        <div><a href="#top">Back to top <ArrowLeft size={14} /></a></div>
      </div>
    </footer>
  );
}

export default function App() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (!target) return;
    window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView());
  }, []);

  return (
    <>
      <Header />
      <Hero />
      <PageIndex />
      <CompanionMethod />
      <CompanionComponents />
      <CompanionAnnotation />
      <CompanionSimulations />
      <ResultsSection />
      <CitationSection />
      <CtaSection />
      <Footer />
    </>
  );
}
