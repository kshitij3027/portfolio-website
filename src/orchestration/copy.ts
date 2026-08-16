/** Single source of truth for every string the site draws, types, or links to. */

export const OWNER = {
  name: 'KSHITIJ KAKADE',
  firstName: 'KSHITIJ',
  lastName: 'KAKADE',
  title: 'BACKEND + AI ENGINEER',
  email: 'kshitijskakade307@gmail.com',
  github: 'https://github.com/kshitij3027',
  githubHandle: 'github.com/kshitij3027',
  linkedin: 'https://www.linkedin.com/in/kshitijkakade307/',
} as const;

/* ---------- chapter cards (the DOM typography overlay) ---------- */

export const CARDS = {
  rag: {
    tab: '01 · AGENTIC RAG',
    desc: 'Full-stack RAG that picks its own tools — vector, web, or SQL.',
    caps: {
      boot: 'one command boots the stack',
      question: 'a question comes in',
      routing: 'the agent routes — vector search wins',
      answer: 'answer returned · citations grounded in the docs',
    },
  },
  coda: {
    tab: '02 · CODAGENT',
    desc: 'A ReAct coding agent that lives in the terminal.',
    caps: {
      launch: 'one shell tool · approval mode',
      prompt: 'plain english in',
      gate: 'every write needs a human yes',
      code: 'python out · 41 rows → 38 unique',
    },
  },
  soc: {
    tab: '03 · SENTINELLITE',
    desc: 'An autonomous SOC — self-hosted, $0, tested on real attack data.',
    caps: {
      upload: 'raw telemetry dropped in — 50 events',
      triage: '4 agents triage in parallel',
      chain: 'kill chain rebuilt — 8 MITRE stages',
      approve: '1 incident · response waits for a human',
    },
  },
} as const;

/* ---------- chapter 1: agentic RAG (drawn in particle frames) ---------- */

export const RAG = {
  bootCmd: 'docker compose up -d',
  bootLines: [
    '[+] Running 4/4',
    '✔ db (pgvector)   Started',
    '✔ api (fastapi)   Started',
    '✔ web (react)     Started',
  ],
  readyLine: 'agentic-rag ready on localhost:3000',
  answerFirstLine: 'Enterprise churn fell to 3.1% in Q3, driven by',
  citations: ['[1] churn_q3.pdf · p4', '[2] accounts.sql'],
  browserUrl: 'localhost:3000 · agentic-rag',
  tools: ['vector', 'web', 'sql'] as const,
  threads: ['Q3 churn analysis', 'pricing objections', 'onboarding faq', 'vendor contracts'],
  docs: ['churn_q3.pdf', 'accounts.sql', 'terms.pdf'],
} as const;

/* ---------- chapter 2: codagent (drawn in particle frames) ---------- */

export const CODA = {
  launchCmd: 'codagent',
  termTitle: '~/repos · zsh',
  statusLine: 'model claude-sonnet-4-5 · mode approval · tool: shell',
  toolLine: '◆ shell → head -3 customers.csv',
  gateLine: '⚠ approval required — write dedupe.py [y/N]',
  wroteLine: '✓ approved · wrote dedupe.py · exit 0',
  resultLine: '41 rows → 38 unique',
  doneLine: '✓ done in 2 steps',
  codeTitle: 'dedupe.py',
  codeLines: [
    'import csv',
    '',
    'def dedupe(rows):',
    '    seen, out = set(), []',
    '    for r in rows:',
    '        key = r["email"].lower()',
    '        if key not in seen:',
    '            seen.add(key)',
    '            out.append(r)',
    '    return out',
  ],
} as const;

/* ---------- chapter 3: sentinellite (drawn in particle frames) ---------- */

export const SOC = {
  browserUrl: 'localhost:8000 · sentinellite',
  header: 'SENTINELLITE — AUTONOMOUS SOC',
  dropLabel: 'drop telemetry · .json / .ndjson',
  sourceChips: ['github', 'cloudtrail', 'okta', 'falco'],
  fileCard: 'cloudtrail_0813.ndjson · 50 events',
  agents: ['Triage', 'Identity', 'Endpoint', 'SupplyChain'],
  correlator: 'Correlator',
  stats: [
    { value: '50', label: 'ALERTS' },
    { value: '42', label: 'AUTO-CLOSED · 84%' },
    { value: '8', label: 'ESCALATED' },
    { value: '1', label: 'INCIDENT' },
  ],
  killChain: [
    { id: 'T1195.002', label: 'Initial Access' },
    { id: 'T1059.004', label: 'Execution' },
    { id: 'T1552.001', label: 'Cred Access' },
    { id: 'T1567.002', label: 'Exfil' },
    { id: 'T1078.004', label: 'Lateral' },
    { id: 'T1087.004', label: 'Discovery' },
    { id: 'T1098.001', label: 'Persistence' },
    { id: 'T1530', label: 'Collection' },
  ],
  incidentTitle: 'supply-chain breach · caught in 2.3 min',
  incidentSub: '5 actions staged — awaiting human approval',
} as const;
