import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import katex from "katex";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import source from "./companionData.json";

type ModalContent = { title: string; body: React.ReactNode } | null;
type StateVector = Record<string, string>;
type ExampleTurn = { index: number; role: string; text: string; option?: string; primitiveAction?: string; confidence?: number; state?: StateVector };
type Change = { dimension: string; from: unknown; to: unknown };
type SimTurn = { index: number; agent: string; user: string; option: string; primitiveAction: string; terminated: boolean; terminationProbability: number | null; stateUpdated: boolean; changes: Change[] };
type SimCase = { id: string; domain: string; model: string; outcome: { label: string; value: string | number }; profile: Record<string, unknown>; turns: SimTurn[] };
type ComponentData = {
    options: Array<{ name: string; description: string; goal: { objective: string; success_levels: Record<string, string>; reward_hint: string } }>;
    primitiveGroups: Array<{ name: string; micro_actions: Array<{ name: string; description: string }> }>;
    states: Array<{ "Variable Name": string; Description: string; "Categorical values": string[] }>;
    profileSchema: { static_dimensions: Array<{ dimension_name: string; description: string }>; dynamic_dimensions: Array<{ dimension_name: string; description: string; options: string[] }> };
    graphNodes: Array<{ name: string; description: string }>;
    graphEdges: Array<{ source: string; relation: string; target: string }>;
};
const data = source as unknown as {
  components: ComponentData;
  p4gComponents: ComponentData;
  annotation: { source: string; turns: ExampleTurn[] };
  simulations: SimCase[];
};

function MathLine({ tex }: { tex: string }) {
  return <div className="companion-math" dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }) }} />;
}

function Modal({ content, close }: { content: ModalContent; close: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!content) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [content, close]);
  if (!content) return null;
  return createPortal(<div className="companion-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className="companion-modal" role="dialog" aria-modal="true" aria-labelledby="companion-modal-title">
      <header><h2 id="companion-modal-title">{content.title}</h2><button ref={closeRef} type="button" aria-label="Close details" onClick={close}><X size={20} /></button></header>
      <div className="companion-modal__body">{content.body}</div>
    </div>
  </div>, document.body);
}

const detailContent = {
  extraction: <div className="companion-detail">
    <img src="./figures/fig4-page.svg" alt="Textbook extraction pipeline" />
    <p>For each target component, TOPAS gathers relevant chapter evidence, merges the evidence within a textbook, and extracts a typed record. When several textbooks are available, corresponding records are reconciled while retaining source references.</p>
    <MathLine tex={String.raw`z^p_\ell=\operatorname{SummaryChapter}(\ell;p),\qquad p_b=\operatorname{ExtractComponent}\!\left(\operatorname{MergeChapters}(\{z^p_\ell\}_{\ell\in b})\right)`} />
    <p>The resulting prior specifies options, primitive actions, conversation states, rewards, the memory graph, and a user profile. Option goals define ideal, acceptable, and unsuccessful outcomes for the corresponding reward rubric.</p>
    <MathLine tex={String.raw`P_\Omega=(\mathcal O,\mathcal S,\{\mathcal S^o\},\{\mathcal A^o\},r,\{r^o\},(\mathcal N,\mathcal E),\mathcal S^{\rm user})`} />
  </div>,
  annotation: <div className="companion-detail">
    <img src="./figures/fig5-page.svg" alt="Dialogue self annotation and refinement pipeline" />
    <p>TOPAS segments expert dialogue into option spans, assigns each system turn a primitive action within its option, tracks conversation state after user turns, and scores progress at option and dialogue boundaries.</p>
    <p>Independent annotation passes vote on each label. High agreement labels are retained; disputed labels receive targeted review. The transcript below displays recorded CBT annotations beside the utterances they describe.</p>
  </div>,
  rl: <div className="companion-detail">
    <img src="./figures/fig8-planner-state.svg" alt="Planner state construction" />
    <h3>From dialogue to planner state</h3>
    <p>At each turn, TOPAS reads a hidden representation from the frozen dialogue model. A probe predicts the textbook-defined conversation state from that representation and the preceding state. The layer with the highest held-out probe accuracy supplies both the representation used within an option and the predicted state used to choose options.</p>
    <MathLine tex={String.raw`\mathcal L_{\mathrm{probe}}=-\mathbb E_{\mathcal D^{\mathrm{ann}}_\Omega}\!\left[\sum_{j=1}^{d_{\mathcal S}}\log g_{\ell,j}(s_{t,j}\mid h_t^\ell,s_{t-1})\right]`} />
    <MathLine tex={String.raw`\begin{aligned}\ell^\star&=\arg\max_{\ell\in\mathcal L}\mathrm{Acc}(g_\ell),\\ s_t^o&=h_t^{\ell^\star},\qquad \hat s_t=\arg\max_{s\in\mathcal S}g_{\ell^\star}(h_t^{\ell^\star})[s].\end{aligned}`} />
    <img src="./figures/fig-policy-training.svg" alt="Offline policy training stages" />
    <p>Offline Implicit Q-Learning (IQL) trains the two levels of the planner on annotated dialogue. Within an option, its reward r<sup>o</sup> measures progress toward that option's goal. Across options, the global reward r measures progress for the full interaction. Both levels fit a Q function and a state value V; their difference is the advantage. The expectile loss below favors high-value decisions that appear in the logged data.</p>
    <MathLine tex={String.raw`L_2^\eta(u)=\left|\eta-\mathbf 1(u<0)\right|u^2,\qquad A=Q-V`} />
    <h3>Primitive actions within an option</h3>
    <p>For each option, the Q function learns from its observed primitive actions and option rewards. The end-of-option mask stops the target from carrying value into another option. The value function fits the upper expectile of observed action values.</p>
    <MathLine tex={String.raw`\begin{aligned}\mathcal L_Q(\omega^o)&=\mathbb E_{\mathcal D^o}\!\left[\left(Q_{\omega^o}(s_t^o,a_t,m_t)-r_t^o-\gamma(1-e_t^o)V_{\nu^o}(s_{t+1}^o,m_{t+1})\right)^2\right],\\\mathcal L_V(\nu^o)&=\mathbb E_{\mathcal D^o}\!\left[L_2^\eta\!\left(Q_{\omega^o}(s_t^o,a_t,m_t)-V_{\nu^o}(s_t^o,m_t)\right)\right].\end{aligned}`} />
    <p>Advantage-weighted regression then gives more weight to logged primitive actions that outperform the option's state baseline.</p>
    <MathLine tex={String.raw`\begin{aligned}A_t^o&=Q_{\omega^o}(s_t^o,a_t,m_t)-V_{\nu^o}(s_t^o,m_t),\\\mathcal L_\pi(\phi^o)&=-\mathbb E_{\mathcal D^o}\!\left[e^{\alpha A_t^o}\log\pi_{\phi^o}(a_t\mid s_t^o,m_t)\right].\end{aligned}`} />
    <h3>Choosing and ending options</h3>
    <p>The option-level critic learns from global reward one turn at a time. At the next turn, continuation value U mixes the value of staying with the current option and the value of handing control back to the policy over options.</p>
    <MathLine tex={String.raw`U(\hat s',o)=\bigl(1-\beta_{\psi^o}(s'^o)\bigr)Q_\zeta(\hat s',o)+\beta_{\psi^o}(s'^o)V_\kappa(\hat s')`} />
    <MathLine tex={String.raw`\begin{aligned}\mathcal L_Q(\zeta)&=\mathbb E\!\left[\left(Q_\zeta(\hat s_t,o_t)-r_t-\gamma(1-e_t)U(\hat s_{t+1},o_t)\right)^2\right],\\\mathcal L_V(\kappa)&=\mathbb E\!\left[L_2^\eta\!\left(Q_\zeta(\hat s_t,o_t)-V_\kappa(\hat s_t)\right)\right].\end{aligned}`} />
    <p>The option policy imitates higher-advantage choices. The termination target increases when switching options has greater estimated value than continuing the current one.</p>
    <MathLine tex={String.raw`\begin{aligned}A_t&=Q_\zeta(\hat s_t,o_t)-V_\kappa(\hat s_t),\\\mathcal L_\mu(\theta)&=-\mathbb E\!\left[e^{\alpha A_t}\log\mu_\theta(o_t\mid\hat s_t)\right].\end{aligned}`} />
    <MathLine tex={String.raw`\begin{aligned}\beta_t^\star&=\sigma\!\left(-\frac{Q_\zeta(\hat s_t,o)-V_\kappa(\hat s_t)}{\tau_\beta}\right),\\\mathcal L_\beta(\psi^o)&=-\mathbb E_{\mathcal D^o}\!\left[\beta_t^\star\log\beta_{\psi^o}(s_t^o)+(1-\beta_t^\star)\log\bigl(1-\beta_{\psi^o}(s_t^o)\bigr)\right].\end{aligned}`} />
    <h3>Retrieving relevant memory</h3>
    <p>A separate policy ranks triples in the updated memory graph. It learns from the triples used by expert utterances and applies the same option-level advantage weights, so useful context is favored alongside useful primitive actions.</p>
    <MathLine tex={String.raw`\begin{aligned}\mathcal L_{\mathrm{ret}}(\rho)=-\mathbb E_{\mathcal D^o}\!\Biggl[e^{\alpha A_t^o}\sum_{x\in m_t^\star}\log\frac{e^{f_\rho^{\mathrm{ret}}(x\mid s_t^o,o_t)}}{\sum_{x'\in\mathcal T_t}e^{f_\rho^{\mathrm{ret}}(x'\mid s_t^o,o_t)}}\Biggr],\\ m_t^\star\subseteq\mathcal T_t\subseteq\mathcal N\times\mathcal E\times\mathcal N.\end{aligned}`} />
    <p>The training order is: fit and freeze the state probe; train the within-option critics, primitive-action policies, and memory retrieval; then alternate option-level critic and termination updates before extracting the policy over options.</p>
  </div>,
};

export function CompanionMethod() {
  const [modal, setModal] = useState<ModalContent>(null);
  const close = () => setModal(null);
  const steps = [
    { key: "extraction" as const, number: "01", title: "Extract a domain prior", text: "Textbooks yield a shared vocabulary of options, primitive actions, states, rewards, memory relations, and user profiles. Chapter evidence is consolidated into typed components with source references." },
    { key: "annotation" as const, number: "02", title: "Annotate expert dialogue", text: "The prior turns unlabeled conversations into trajectories with option spans, turn actions, state estimates, and reward signals. Repeated passes focus review where labels are uncertain." },
    { key: "rl" as const, number: "03", title: "Learn the planner", text: "Offline reinforcement learning trains decisions within and across options. A frozen dialogue model writes the response after the planner chooses an option and primitive action." },
  ];
  return <section className="section companion-method" id="method"><div className="section-shell section-shell--wide">
    <div className="companion-heading"><span className="mini-label">Method</span><h2>From instructional text to dialogue policy.</h2><p>The paper gives the full formulation. This overview connects its three stages; open any stage for diagrams and equations.</p></div>
    <button className="companion-overview" type="button" onClick={() => setModal({ title: "TOPAS system overview", body: <img src="./figures/fig3-page.svg" alt="TOPAS system overview at full size" /> })} aria-label="Open TOPAS system overview">
      <img src="./figures/fig3-page.svg" alt="TOPAS system overview: extraction, annotation, and policy training" />
    </button>
    <div className="companion-method-grid">{steps.map((step) => <article id={step.key} key={step.key}>
      <span className="companion-step-number">{step.number}</span><h3>{step.title}</h3><p>{step.text}</p>
      <button className="companion-text-button" type="button" onClick={() => setModal({ title: step.title, body: detailContent[step.key] })}>More details <ArrowRight size={16} /></button>
    </article>)}</div>
  </div><Modal content={modal} close={close} /></section>;
}

type ComponentTab = "options" | "states" | "rewards" | "memory" | "profile";
export function CompanionComponents() {
  const [domain, setDomain] = useState<"cbt" | "p4g">("cbt");
  const [tab, setTab] = useState<ComponentTab>("options");
  const components = domain === "cbt" ? data.components : data.p4gComponents;
  const tabs: Array<{ key: ComponentTab; label: string; count: string }> = [
    { key: "options", label: "Options & primitive actions", count: `${components.options.length} / ${components.primitiveGroups.reduce((sum, group) => sum + group.micro_actions.length, 0)}` },
    { key: "states", label: "Conversation states", count: String(components.states.length) },
    { key: "rewards", label: "Option goals", count: String(components.options.length) },
    { key: "memory", label: "Graph memory", count: `${components.graphNodes.length} / ${components.graphEdges.length}` },
    { key: "profile", label: "User profile", count: `${components.profileSchema.static_dimensions.length} / ${components.profileSchema.dynamic_dimensions.length}` },
  ];
  return <section className="section companion-components" id="components"><div className="section-shell section-shell--wide">
    <div className="companion-heading"><span className="mini-label">Extracted components · {domain.toUpperCase()}</span><h2>Browse the extracted components.</h2><p>{domain === "cbt" ? "CBT entries come from the latest paper appendix and component exports." : "P4G entries come from the refined component export; profile dimensions follow the selected simulation profile."} Select a family, then expand an entry to read its definition.</p></div>
    <div className="companion-domain-switch" role="group" aria-label="Component domain"><button type="button" className={domain === "cbt" ? "active" : ""} aria-pressed={domain === "cbt"} onClick={() => { setDomain("cbt"); setTab("options"); }}>CBT components</button><button type="button" className={domain === "p4g" ? "active" : ""} aria-pressed={domain === "p4g"} onClick={() => { setDomain("p4g"); setTab("options"); }}>P4G components</button></div>
    <div className="companion-tabs" role="tablist" aria-label="Extracted component family">{tabs.map((item) => <button role="tab" aria-selected={tab === item.key} className={tab === item.key ? "active" : ""} type="button" key={item.key} onClick={() => setTab(item.key)}>{item.label}<span>{item.count}</span></button>)}</div>
    <div className="companion-component-grid" role="tabpanel" key={`${domain}-${tab}`}>
      {tab === "options" && components.options.map((option, index) => {
        const group = components.primitiveGroups.find((item) => item.name === option.name);
        return <details className="companion-component-card" key={option.name} open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{option.name}</strong><small>{group?.micro_actions.length ?? 0} primitive actions</small><ChevronDown size={17} /></summary><p>{option.description}</p><div className="companion-action-list">{group?.micro_actions.map((action) => <div key={action.name}><strong>{action.name}</strong><p>{action.description}</p></div>)}</div></details>;
      })}
      {tab === "states" && components.states.map((state, index) => <details className="companion-component-card" key={state["Variable Name"]}><summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{state["Variable Name"]}</strong><ChevronDown size={17} /></summary><p>{state.Description}</p><div className="companion-tags">{state["Categorical values"]?.map((value) => <span key={value}>{value}</span>)}</div></details>)}
      {tab === "rewards" && components.options.map((option, index) => <details className="companion-component-card" key={option.name}><summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{option.name}</strong><ChevronDown size={17} /></summary><p>{option.goal.objective}</p><dl>{Object.entries(option.goal.success_levels).map(([level, value]) => <div key={level}><dt>{level}</dt><dd>{value}</dd></div>)}<div><dt>Reward hint</dt><dd>{option.goal.reward_hint}</dd></div></dl></details>)}
      {tab === "memory" && <><div className="companion-component-card companion-component-card--plain"><h3>{components.graphNodes.length} node types</h3>{components.graphNodes.map((node) => <details key={node.name}><summary>{node.name}</summary><p>{node.description}</p></details>)}</div><div className="companion-component-card companion-component-card--plain"><h3>{components.graphEdges.length} typed relations</h3><div className="companion-memory-edges">{components.graphEdges.map((edge, index) => <div key={`${edge.source}-${edge.relation}-${edge.target}-${index}`}><span>{edge.source}</span><strong>{edge.relation}</strong><span>{edge.target}</span></div>)}</div></div></>}
      {tab === "profile" && <><div className="companion-component-card companion-component-card--plain"><h3>Static dimensions</h3>{components.profileSchema.static_dimensions.map((item) => <details key={item.dimension_name}><summary>{item.dimension_name}</summary><p>{item.description}</p></details>)}</div><div className="companion-component-card companion-component-card--plain"><h3>Dynamic dimensions</h3>{components.profileSchema.dynamic_dimensions.map((item) => <details key={item.dimension_name}><summary>{item.dimension_name}</summary><p>{item.description}</p></details>)}</div></>}
    </div>
  </div></section>;
}

export function CompanionAnnotation() {
  const [visible, setVisible] = useState(true);
  const [modal, setModal] = useState<ModalContent>(null);
  const close = () => setModal(null);
  return <section className="section companion-examples" id="explorer"><div className="section-shell section-shell--wide">
    <div className="companion-heading"><span className="mini-label">Expert dialogue · CBT</span><h2>See how a real session becomes a trajectory.</h2><p>These are the opening turns of {data.annotation.source}. The option and primitive action labels come from the annotation files; state vectors follow client replies.</p><small className="companion-source-note">This annotation export tracks 62 state dimensions; the current paper appendix lists 34 extracted schema variables.</small></div>
    <div className="companion-example-toolbar"><span>{data.annotation.turns.length} transcript utterances</span><button type="button" className={visible ? "companion-toggle active" : "companion-toggle"} aria-pressed={visible} onClick={() => setVisible(!visible)}>Annotations {visible ? "on" : "off"}</button></div>
    <div className="companion-transcript">{data.annotation.turns.map((turn) => <article className={`companion-utterance companion-utterance--${turn.role}`} key={turn.index}>
      <div className="companion-utterance__meta"><span>{turn.role === "system" ? "Therapist" : "Client"}</span><small>Utterance {turn.index + 1}</small></div>
      <p>{turn.text}</p>
      {visible && (turn.option || turn.state) && <div className="companion-inline-annotation">
        {turn.option && <><span><small>Option</small>{turn.option}</span><span><small>Primitive action</small>{turn.primitiveAction}</span></>}
        {turn.state && <button className="companion-text-button" type="button" onClick={() => setModal({ title: `Conversation state after utterance ${turn.index + 1}`, body: <StateTable state={turn.state!} /> })}>View full state vector <ArrowRight size={15} /></button>}
      </div>}
    </article>)}</div>
  </div><Modal content={modal} close={close} /></section>;
}

function StateTable({ state }: { state: StateVector }) { return <div className="companion-state-table">{Object.entries(state).map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}</div>; }
function formatValue(value: unknown): string { return Array.isArray(value) ? value.join(", ") : String(value ?? "unknown"); }
function ProfileBody({ profile }: { profile: Record<string, unknown> }) {
  if (Array.isArray(profile.static_dimensions)) return <div className="companion-profile">{(profile.static_dimensions as Array<{ dimension_name: string; value?: string }>).map((item) => <div key={item.dimension_name}><strong>{item.dimension_name}</strong><p>{item.value ?? "Not specified"}</p></div>)}</div>;
  return <div className="companion-profile">{Object.entries(profile).map(([name, value]) => <div key={name}><strong>{name.replaceAll("_", " ")}</strong><p>{formatValue(value)}</p></div>)}</div>;
}

export function CompanionSimulations() {
  const [domain, setDomain] = useState("cbt");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<ModalContent>(null);
  const [fields, setFields] = useState({ termination: false, option: true, action: true, state: false });
  const current = data.simulations.find((item) => item.domain === domain)!;
  const pageSize = 8;
  const pageCount = Math.ceil(current.turns.length / pageSize);
  const turns = current.turns.slice(page * pageSize, (page + 1) * pageSize);
  const close = () => setModal(null);
  const setDomainAndReset = (next: string) => { setDomain(next); setPage(0); };
  const toggle = (field: keyof typeof fields) => setFields((old) => ({ ...old, [field]: !old[field] }));
  return <section className="section companion-simulations" id="sessions"><div className="section-shell section-shell--wide">
    <div className="companion-heading"><span className="mini-label">Simulated sessions · TOPAS policy</span><h2>Follow the policy through a complete run.</h2><p>Choose a successful CBT or P4G simulation. The dialogue is copied from its run log, while the controls reveal recorded option, primitive action, termination, and conversation state outputs.</p></div>
    <div className="companion-sim-tabs" role="tablist" aria-label="Simulation domain"><button role="tab" aria-selected={domain === "cbt"} className={domain === "cbt" ? "active" : ""} onClick={() => setDomainAndReset("cbt")}>CBT · therapy</button><button role="tab" aria-selected={domain === "p4g"} className={domain === "p4g" ? "active" : ""} onClick={() => setDomainAndReset("p4g")}>P4G · persuasion</button></div>
    <div className="companion-example-toolbar"><div><strong>{current.id}</strong><span>{current.turns.length} turns · {current.outcome.label}: {current.outcome.value}</span></div><button className="companion-text-button" onClick={() => setModal({ title: `${domain.toUpperCase()} user profile`, body: <ProfileBody profile={current.profile} /> })}>View user profile <ArrowRight size={15} /></button></div>
    <div className="companion-controls" aria-label="Show policy outputs">{([['option', 'Option'], ['action', 'Primitive action'], ['termination', 'Termination output'], ['state', 'Conversation state updates']] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={fields[key]} className={fields[key] ? "active" : ""} onClick={() => toggle(key)}><span aria-hidden="true">{fields[key] ? "✓" : "+"}</span>{label}</button>)}</div>
    <div className="companion-sim-turns" key={domain}>{turns.map((turn) => <article className="companion-sim-turn" key={turn.index}>
      <div className="companion-turn-index">Turn {turn.index}</div>
      <div className="companion-utterance companion-utterance--system"><div className="companion-utterance__meta"><span>{domain === "cbt" ? "Therapist" : "Persuader"}</span></div><p>{turn.agent}</p>{(fields.option || fields.action || fields.termination) && <div className="companion-inline-annotation">
        {fields.option && <span><small>Option</small>{turn.option || "Unavailable"}</span>}
        {fields.action && <span><small>Primitive action</small>{turn.primitiveAction || "Unavailable"}</span>}
        {fields.termination && <span><small>Termination output</small>{turn.terminated ? "Terminate current option" : "Continue current option"}</span>}
      </div>}</div>
      <div className="companion-utterance companion-utterance--user"><div className="companion-utterance__meta"><span>{domain === "cbt" ? "Patient" : "Persuadee"}</span></div><p>{turn.user}</p>{fields.state && <div className="companion-inline-annotation companion-state-changes"><small>Conversation state update · {turn.stateUpdated ? `${turn.changes.length} changed dimensions` : "not updated"}</small>{turn.changes.length > 0 && <div>{turn.changes.map((change) => <span key={change.dimension}><strong>{change.dimension}</strong><i>{formatValue(change.from)} → {formatValue(change.to)}</i></span>)}</div>}</div>}</div>
    </article>)}</div>
    <div className="companion-pagination"><span>Turns {page * pageSize + 1}–{Math.min((page + 1) * pageSize, current.turns.length)} of {current.turns.length}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={page === pageCount - 1} onClick={() => setPage(page + 1)}>Next turns <ArrowRight size={15} /></button><button type="button" disabled={page === pageCount - 1} onClick={() => setPage(pageCount - 1)}>Final turns</button></div></div>
  </div><Modal content={modal} close={close} /></section>;
}
