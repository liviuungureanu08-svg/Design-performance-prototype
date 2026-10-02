// Three ILLUSTRATIVE briefs (invented businesses, written in the voice of real first messages). Markup:
//   {n:text}  = signal: a problem the business actually has (n = 1..4, reading order) -> becomes one part of the system
//   ~text~    = noise: the client's own guess at the solution / their uncertainty -> struck by the reader
//   anything else = context (kept)
export type SurfaceKey = 'site' | 'app' | 'flow' | 'ai';

export interface Brief {
  id: string;
  label: string;
  kind: string;
  note: string;
  /** signal group (1..4) -> which surface it becomes */
  map: Record<number, SurfaceKey>;
  /** the line under the final statement */
  said: string;
  system: string;
  theme: string; // css class on each surface: brand of the CLIENT, not of Gabriel
  alt: Record<SurfaceKey, string>;
}

export const SURFACE_LABEL: Record<SurfaceKey, string> = {
  site: 'Website',
  app: 'App / platform',
  flow: 'Automation',
  ai: 'AI',
};

export const BRIEFS: Brief[] = [
  {
    id: 'bakery',
    label: 'Bakery',
    kind: 'Local business',
    note:
      "Hi — I run a small bakery. ~I think I need a website? Or maybe an app.~ Honestly, {1:people just WhatsApp me their orders} and {2:I lose track.} {3:My regulars deserve better.} {4:I never know how much to bake.} ~I don't really know where to start.~",
    map: { 1: 'flow', 2: 'app', 3: 'site', 4: 'ai' },
    said: 'She asked for a website. She described a bakery that has outgrown its tools.',
    system: 'Alba Bakehouse (illustrative)',
    theme: 'th-bakery',
    alt: {
      site: 'Website for the bakery: pre-order for tomorrow, and a returning customer is greeted with her usual order and a one-tap reorder.',
      app: 'Owner app: tomorrow’s orders by pickup time with status, and a bake list totalled automatically.',
      flow: 'Automation: a WhatsApp message becomes a parsed, confirmed order, a kitchen-list line and a reply, with no retyping.',
      ai: 'AI assistant: answers customers about stock and reserves items, and forecasts tomorrow’s bake from sales and weather.',
    },
  },
  {
    id: 'freight',
    label: 'Freight',
    kind: 'Medium company',
    note:
      'We run regional freight — about 140 people. ~We were told we need a new website, maybe a portal.~ {1:Customers keep asking where their load is.} {2:Dispatch still lives in spreadsheets and phone calls.} {3:Drivers send proof of delivery as photos in a group chat.} {4:We only learn a load is late after it already is.} ~Everyone has a different idea of what to build.~',
    map: { 1: 'site', 2: 'app', 3: 'flow', 4: 'ai' },
    said: 'They asked for a portal. They described a company running blind between the depot and the customer.',
    system: 'Northline Freight (illustrative)',
    theme: 'th-freight',
    alt: {
      site: 'Customer tracking site: enter a load number and see where it is, with a timeline and an estimated arrival.',
      app: 'Driver and dispatch app: today’s loads in order, with proof of delivery captured in the app.',
      flow: 'Automation: a driver’s delivery photo is matched to its load, an invoice is drafted, and the customer is notified.',
      ai: 'AI assistant: answers “will it arrive on time?” from live data and warns dispatch before a load slips.',
    },
  },
  {
    id: 'atelier',
    label: 'Atelier',
    kind: 'Premium brand',
    note:
      "We make hand-blown lighting, sold in fourteen countries. ~Our website looks like 2016, so I suppose we need a redesign.~ {1:It feels nothing like the pieces.} {2:Designers email us for specs, and we send them by hand.} {3:Every country gets prices and lead times wrong.} {4:Nobody can tell which piece suits their room.} ~I'm told this is a branding problem.~",
    map: { 1: 'site', 2: 'app', 3: 'flow', 4: 'ai' },
    said: 'They asked for a redesign. They described a brand whose experience stops where the glass ends.',
    system: 'Maison Orla (illustrative)',
    theme: 'th-atelier',
    alt: {
      site: 'Brand website: a pendant presented as an object, with finish and size choices, and the price and lead time for the visitor’s country.',
      app: 'Trade portal for interior designers: specifications, CAD and lighting files and quote requests in one place.',
      flow: 'Automation: a quote request is priced for the destination country, duty and lead time are applied, and a quote is sent.',
      ai: 'AI concierge: recommends the right piece and height for a described room, and shows it.',
    },
  },
];

export const CAPTIONS = [
  { k: 'UNDERSTAND', t: 'We read the problem, not the request.' },
  { k: 'DESIGN', t: 'Each problem becomes one designed part of a single system.' },
  { k: 'BUILD', t: 'Then it is engineered to run: logic, data, states.' },
  { k: 'AMPLIFY', t: 'And put to work: it answers, routes, forecasts.' },
];

export interface Tok { t: string; k: 'c' | 'n' | 's'; g: number; internal: boolean }

export function parseNote(note: string): Tok[] {
  const out: Tok[] = [];
  const re = /\{(\d):([^}]+)\}|~([^~]+)~|([^{~]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(note))) {
    const kind: Tok['k'] = m[1] ? 's' : m[3] ? 'n' : 'c';
    const text = (m[2] ?? m[3] ?? m[4]) as string;
    const g = m[1] ? Number(m[1]) : 0;
    const ws = text.split(/\s+/).filter(Boolean);
    ws.forEach((w, i) => out.push({ t: w, k: kind, g, internal: kind !== 'c' && i < ws.length - 1 }));
  }
  return out;
}
