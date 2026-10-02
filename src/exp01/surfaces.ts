// The four surfaces of each client's system, as real (illustrative) interfaces — not diagrams of boxes.
// Layers: no class = DESIGN (structure, identity, type); .b = BUILD (data, logic, states); .a = AMPLIFY (it runs).
// .slot = skeleton (.sk) that is replaced in place by the built content (.b). Driven by CSS vars --g --pb --pa --r1..--r4.
import type { SurfaceKey } from './data';

const slot = (cls: string, inner: string, bd = 0, skw = 70) =>
  `<span class="slot ${cls}" style="--bd:${bd}"><i class="sk" style="width:${skw}%"></i><span class="b">${inner}</span></span>`;
const chat = (who: 'me' | 'ai', txt: string, cls: string, bd: number) =>
  `<div class="bub ${who} ${cls}" style="--bd:${bd}">${txt}</div>`;

const wheat = `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="lf" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#E3AE54"/><stop offset=".6" stop-color="#B86F25"/><stop offset="1" stop-color="#8A4A18"/></radialGradient></defs>
<circle cx="100" cy="100" r="92" fill="#EBD3A0"/><ellipse cx="100" cy="124" rx="66" ry="12" fill="#9A6A2D" opacity=".25"/>
<path d="M30 112c0-38 32-58 70-58s70 20 70 58c0 14-30 22-70 22s-70-8-70-22z" fill="url(#lf)"/>
<g fill="none" stroke="#F6E6C2" stroke-width="5" stroke-linecap="round"><path d="M66 80c10 10 14 24 12 40"/><path d="M98 72c9 11 12 28 10 46"/><path d="M130 80c8 10 11 22 9 36"/></g>
<g fill="none" stroke="#3E4A23" stroke-width="2.4" stroke-linecap="round"><path d="M160 48c-6 18-10 38-8 62"/><path d="M152 66c-8-2-12-6-14-12M153 78c8-2 12-6 14-12M152 92c-8-2-12-6-14-12M153 104c8-2 12-6 14-12"/></g></svg>`;

const lamp = `<svg viewBox="0 0 200 260" aria-hidden="true"><defs><radialGradient id="gl" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#FFE2A6"/><stop offset=".45" stop-color="#F0A64A"/><stop offset="1" stop-color="#A8561D"/></radialGradient><radialGradient id="ha" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F0A64A" stop-opacity=".34"/><stop offset="1" stop-color="#F0A64A" stop-opacity="0"/></radialGradient></defs>
<circle cx="100" cy="150" r="98" fill="url(#ha)"/><path d="M100 0v78" stroke="#D8C9B0" stroke-width="2"/><rect x="92" y="70" width="16" height="14" rx="3" fill="#B9A98C"/>
<path d="M100 82c-46 0-70 34-70 66s28 62 70 62 70-30 70-62-24-66-70-66z" fill="url(#gl)"/><path d="M62 118c10-14 28-22 46-22" fill="none" stroke="#FFF3D8" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`;

const route = `<svg viewBox="0 0 220 120" aria-hidden="true"><path d="M14 98C54 96 64 40 108 52S168 22 206 20" fill="none" stroke="#C9C3B6" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/><path d="M14 98C54 96 64 40 108 52" fill="none" stroke="#18283A" stroke-width="3.4" stroke-linecap="round"/><circle cx="14" cy="98" r="5" fill="#18283A"/><circle cx="108" cy="52" r="7.5" fill="#F0A81C" stroke="#18283A" stroke-width="3"/><circle cx="206" cy="20" r="5" fill="#fff" stroke="#18283A" stroke-width="3"/></svg>`;

const room = `<svg viewBox="0 0 200 120" aria-hidden="true"><rect x="1" y="1" width="198" height="118" rx="6" fill="none" stroke="#C9BFAE" stroke-width="1.4"/><rect x="34" y="62" width="132" height="34" rx="3" fill="#E9DFCE" stroke="#B9A98C" stroke-width="1.2"/><g class="b" style="--bd:.1"><path d="M54 24h92" stroke="#D9822B" stroke-width="5" stroke-linecap="round"/><path d="M70 24V8M130 24V8" stroke="#B9A98C" stroke-width="1.4"/><path d="M62 30l-8 30M100 30v30M138 30l8 30" stroke="#F0A64A" stroke-width="1.2" opacity=".6"/><path d="M176 24v38" stroke="#6C6354" stroke-width="1" /><path d="M172 24h8M172 62h8" stroke="#6C6354" stroke-width="1"/></g><text x="30" y="112" font-size="8" fill="#6C6354">3.2 m</text><text x="150" y="46" font-size="8" fill="#6C6354">75 cm</text></svg>`;

const ph = (screen: string) => `<div class="phone"><div class="scr">${screen}</div></div>`;

type Map5 = Record<SurfaceKey, string>;
const SURF: Record<string, Map5> = {
  bakery: {
    site: `<div class="u-site">
<div class="nav"><b class="logo">Alba</b><span class="links"><i>Bread</i><i>Pastry</i><i>Pre-order</i><i>Visit</i></span><span class="btn sm">Order</span></div>
<div class="hero"><div class="copy"><small>Baked before sunrise</small><h3>Bread worth<br>waking up for.</h3><p>Order tonight. Collect it warm tomorrow.</p><div class="row"><span class="btn">Pre-order for tomorrow</span><span class="lnk">Today’s bake →</span></div></div><div class="art">${wheat}</div></div>
<div class="slot strip"><i class="sk" style="width:62%"></i><div class="b" style="--bd:.2"><span class="av">M</span><span class="tx">Welcome back, Maria. <b>Your usual:</b> 2 sourdough, 1 cardamom bun</span><span class="btn sm acc">Reorder</span></div></div></div>`,
    app: ph(`<div class="hd"><small>Tomorrow · Saturday</small><h4>14 orders</h4></div>
<div class="bakebar">${slot('bk', '<span><b>22</b> sourdough</span><span><b>12</b> cardamom</span><span><b>30</b> baguette</span>', 0.05)}</div>
<ul class="rows">
<li class="new a" style="--bd:0"><span class="t">08:00</span><span class="n"><b>Andrei T.</b><i>2 sourdough</i></span><span class="chip nw">New · WhatsApp</span></li>
<li>${slot('t', '07:30', 0.1, 60)}<span class="n">${slot('nm', '<b>Maria P.</b><i>2 sourdough, 1 cardamom</i>', 0.1, 80)}</span>${slot('c', '<span class="chip ok">Ready</span>', 0.12, 50)}</li>
<li>${slot('t', '07:45', 0.2, 60)}<span class="n">${slot('nm', '<b>Café Lumen</b><i>20 baguette</i>', 0.2, 70)}</span>${slot('c', '<span class="chip bk">Baking</span>', 0.22, 50)}</li>
<li>${slot('t', '08:15', 0.3, 60)}<span class="n">${slot('nm', '<b>Ioana R.</b><i>1 rye, 2 buns</i>', 0.3, 66)}</span>${slot('c', '<span class="chip">Queued</span>', 0.32, 50)}</li>
<li>${slot('t', '09:00', 0.4, 60)}<span class="n">${slot('nm', '<b>Dan &amp; Eli</b><i>4 sourdough</i>', 0.4, 60)}</span>${slot('c', '<span class="chip">Queued</span>', 0.42, 50)}</li>
<li>${slot('t', '09:30', 0.5, 60)}<span class="n">${slot('nm', '<b>Sofia L.</b><i>1 rye, 6 buns</i>', 0.5, 60)}</span>${slot('c', '<span class="chip">Queued</span>', 0.52, 50)}</li>
<li>${slot('t', '10:00', 0.6, 60)}<span class="n">${slot('nm', '<b>Hotel Cedar</b><i>40 rolls</i>', 0.6, 60)}</span>${slot('c', '<span class="chip">Queued</span>', 0.62, 50)}</li>
<li>${slot('t', '10:30', 0.7, 60)}<span class="n">${slot('nm', '<b>Pavel M.</b><i>3 sourdough</i>', 0.7, 60)}</span>${slot('c', '<span class="chip">Queued</span>', 0.72, 50)}</li>
</ul><nav class="tabs"><i class="on">Orders</i><i>Bake</i><i>Regulars</i><i>Stock</i></nav>`),
    flow: `<div class="u-flow"><div class="hd"><b>WhatsApp → order</b><small>no retyping</small></div><div class="track">
<div class="node"><small>Message in</small><div class="bubble">2 sourdough for 8am tomorrow please</div></div><i class="wire" style="--k:var(--r1)"><s></s></i>
<div class="node">${'<small>Read</small>'}${slot('rd', '<span class="kv"><u>item</u> sourdough</span><span class="kv"><u>qty</u> 2</span><span class="kv"><u>pickup</u> Sat 08:00</span>', 0.1, 80)}</div><i class="wire" style="--k:var(--r2)"><s></s></i>
<div class="node"><small>Order</small>${slot('rd', '<b class="big">#214</b><span class="kv">confirmed to customer</span>', 0.2, 60)}<em class="ok a" style="--k:var(--r2)">✓</em></div><i class="wire" style="--k:var(--r3)"><s></s></i>
<div class="node"><small>Kitchen</small>${slot('rd', '<span class="kv"><u>bake list</u> +2 sourdough</span><span class="kv"><u>reply</u> sent</span>', 0.3, 70)}<em class="ok a" style="--k:var(--r3)">✓</em></div></div></div>`,
    ai: `<div class="u-ai"><div class="hd"><b>Assistant</b><small>learns from your sales and weather, not the internet</small></div><div class="cols">
<div class="chatcol">${chat('me', 'Do you still have cardamom buns?', 'a', 0.05)}${chat('ai', 'Yes — 6 left. Reserve one for 8:00?', 'a', 0.5)}${slot('chatph', '', 0, 80)}</div>
<div class="fc"><small>Tomorrow · rain · Saturday</small><div class="fr">${slot('fcv', '<b>Bake 24 sourdough</b><i>+18% vs. a normal Saturday</i>', 0.3, 80)}<span class="bars a" style="--bd:0.55"><s style="height:34%"></s><s style="height:46%"></s><s style="height:40%"></s><s style="height:58%"></s><s style="height:52%"></s><s style="height:64%"></s><s class="hi" style="height:86%"></s></span></div><span class="btn sm acc a" style="--bd:0.8">Approve</span></div></div></div>`,
  },
  freight: {
    site: `<div class="u-site">
<div class="nav"><b class="logo">Northline</b><span class="links"><i>Services</i><i>Network</i><i>Track</i><i>Contact</i></span><span class="btn sm">Get a quote</span></div>
<div class="hero"><div class="copy"><small>Customer tracking</small><h3>Where’s my load?</h3><div class="inp"><span>Load number</span><b>NL-48213</b><span class="btn sm acc">Track</span></div>
<div class="tl">${slot('tlr', '<span class="st done"><i></i>Picked up · Kraków 06:10</span><span class="st done"><i></i>In transit · A4</span><span class="st"><i></i>Delivery · est. 14:20</span>', 0.1, 76)}</div></div><div class="art route">${route}</div></div>
<div class="slot strip"><i class="sk" style="width:55%"></i><div class="b" style="--bd:.3"><span class="av">E</span><span class="tx"><b>On time</b> · est. 14:20 · the carrier’s estimate updates itself</span></div></div></div>`,
    app: ph(`<div class="hd"><small>Today · driver</small><h4>4 loads</h4></div>
<div class="bakebar">${slot('bk', '<span><b>NL-48213</b> Kraków → Wrocław</span>', 0.05)}</div>
<ul class="rows">
<li>${slot('t', '14:20', 0.1, 60)}<span class="n">${slot('nm', '<b>Wrocław · Dock 3</b><i>NL-48213 · 22 pallets</i>', 0.1, 80)}</span>${slot('c', '<span class="chip bk">Next</span>', 0.12, 50)}</li>
<li>${slot('t', '16:00', 0.2, 60)}<span class="n">${slot('nm', '<b>Opole · Aldo Foods</b><i>NL-48190 · 8 pallets</i>', 0.2, 70)}</span>${slot('c', '<span class="chip">Queued</span>', 0.22, 50)}</li>
<li>${slot('t', '18:30', 0.3, 60)}<span class="n">${slot('nm', '<b>Katowice · Depot</b><i>NL-48177 · return</i>', 0.3, 66)}</span>${slot('c', '<span class="chip">Queued</span>', 0.32, 50)}</li>
<li>${slot('t', '19:15', 0.4, 60)}<span class="n">${slot('nm', '<b>Gliwice · Hub</b><i>NL-48166 · 12 pallets</i>', 0.4, 66)}</span>${slot('c', '<span class="chip">Queued</span>', 0.42000000000000004, 50)}</li>
<li>${slot('t', '20:40', 0.5, 60)}<span class="n">${slot('nm', '<b>Zabrze · Dock 1</b><i>NL-48159 · 6 pallets</i>', 0.5, 66)}</span>${slot('c', '<span class="chip">Queued</span>', 0.52, 50)}</li>
<li class="new a" style="--bd:0"><span class="t">Now</span><span class="n"><b>Proof of delivery</b><i>Photo captured · NL-48213</i></span><span class="chip ok">Sent</span></li>
</ul><div class="cta">${slot('ctab', '<span class="btn full">Capture proof of delivery</span>', 0.5, 90)}</div><nav class="tabs"><i class="on">Loads</i><i>Docs</i><i>Chat</i><i>Me</i></nav>`),
    flow: `<div class="u-flow"><div class="hd"><b>Photo → invoice</b><small>from the road to the ledger</small></div><div class="track">
<div class="node"><small>Driver photo</small><div class="bubble doc"><span></span><span></span><span></span><b>POD</b></div></div><i class="wire" style="--k:var(--r1)"><s></s></i>
<div class="node"><small>Matched</small>${slot('rd', '<b class="big">NL-48213</b><span class="kv">signature read</span>', 0.1, 70)}<em class="ok a" style="--k:var(--r2)">✓</em></div><i class="wire" style="--k:var(--r2)"><s></s></i>
<div class="node"><small>Invoice</small>${slot('rd', '<b class="big">€1,840</b><span class="kv">drafted · ready</span>', 0.2, 60)}<em class="ok a" style="--k:var(--r3)">✓</em></div><i class="wire" style="--k:var(--r3)"><s></s></i>
<div class="node"><small>Customer</small>${slot('rd', '<span class="kv"><u>status</u> delivered</span><span class="kv"><u>invoice</u> sent</span>', 0.3, 70)}<em class="ok a" style="--k:var(--r3)">✓</em></div></div></div>`,
    ai: `<div class="u-ai"><div class="hd"><b>Load assistant</b><small>answers from live data, warns before it slips</small></div><div class="cols">
<div class="chatcol">${chat('me', 'Will NL-48213 arrive before 3 pm?', 'a', 0.05)}${chat('ai', 'Likely 14:20. Traffic on the A4 adds about 12 min. I’ll warn you if that changes.', 'a', 0.5)}${slot('chatph', '', 0, 80)}</div>
<div class="fc"><small>Dispatch · at risk</small><div class="fr">${slot('fcv', '<b>NL-48190 · +38 min</b><i>Opole slot 16:00 is at risk</i>', 0.3, 80)}<span class="bars a" style="--bd:0.55"><s style="height:30%"></s><s style="height:34%"></s><s style="height:38%"></s><s style="height:44%"></s><s style="height:58%"></s><s style="height:70%"></s><s class="hi" style="height:90%"></s></span></div><span class="btn sm acc a" style="--bd:0.8">Re-plan</span></div></div></div>`,
  },
  atelier: {
    site: `<div class="u-site">
<div class="nav"><b class="logo">Orla</b><span class="links"><i>Pendants</i><i>Linear</i><i>Studio</i><i>Trade</i></span><span class="btn sm">Visit</span></div>
<div class="hero"><div class="copy"><small>Hand-blown in small batches</small><h3>Light, held<br>in glass.</h3>
<div class="opt">${slot('opts', '<span><u>Finish</u><i class="sw a1"></i><i class="sw a2"></i><i class="sw a3"></i></span><span><u>Size</u><b>Ø 42 cm</b></span>', 0.1, 70)}</div>
<div class="row"><span class="btn">Reserve this piece</span></div></div><div class="art lampart">${lamp}</div></div>
<div class="slot strip"><i class="sk" style="width:60%"></i><div class="b" style="--bd:.3"><span class="av">DE</span><span class="tx"><b>€1,860</b> · ships to Germany in about 6 weeks · duties included</span></div></div></div>`,
    app: ph(`<div class="hd"><small>Orla · Trade</small><h4>Villa Roche, Lyon</h4></div>
<div class="bakebar">${slot('bk', '<span><b>2</b> pieces</span><span><b>14</b> files</span><span><b>1</b> quote</span>', 0.05)}</div>
<ul class="rows">
<li>${slot('t', 'Ø42', 0.1, 60)}<span class="n">${slot('nm', '<b>Orla Pendant 42</b><i>Spec · CAD · IES</i>', 0.1, 80)}</span>${slot('c', '<span class="chip ok">Ready</span>', 0.12, 50)}</li>
<li>${slot('t', '120', 0.2, 60)}<span class="n">${slot('nm', '<b>Orla Linear 120</b><i>Spec · CAD · IES</i>', 0.2, 70)}</span>${slot('c', '<span class="chip ok">Ready</span>', 0.22, 50)}</li>
<li>${slot('t', 'Q', 0.3, 60)}<span class="n">${slot('nm', '<b>Quote request</b><i>6 × Pendant 42 · France</i>', 0.3, 66)}</span>${slot('c', '<span class="chip bk">Pricing</span>', 0.32, 50)}</li>
<li>${slot('t', 'Ø30', 0.4, 60)}<span class="n">${slot('nm', '<b>Orla Pendant 30</b><i>Spec · CAD · IES</i>', 0.4, 66)}</span>${slot('c', '<span class="chip">Ready</span>', 0.42000000000000004, 50)}</li>
<li>${slot('t', '90', 0.5, 60)}<span class="n">${slot('nm', '<b>Orla Wall 90</b><i>Spec · CAD · IES</i>', 0.5, 66)}</span>${slot('c', '<span class="chip">Ready</span>', 0.52, 50)}</li>
<li class="new a" style="--bd:0"><span class="t">Q-0931</span><span class="n"><b>Quote sent</b><i>Valid 30 days · lead time 7 wk</i></span><span class="chip nw">New</span></li>
</ul><div class="cta">${slot('ctab', '<span class="btn full">Request a quote</span>', 0.5, 90)}</div><nav class="tabs"><i class="on">Projects</i><i>Library</i><i>Quotes</i><i>Me</i></nav>`),
    flow: `<div class="u-flow"><div class="hd"><b>Request → quote</b><small>right for every country</small></div><div class="track">
<div class="node"><small>Request</small><div class="bubble">6 × Orla 42 for a villa in Lyon</div></div><i class="wire" style="--k:var(--r1)"><s></s></i>
<div class="node"><small>Priced · FR</small>${slot('rd', '<span class="kv"><u>VAT</u> applied</span><span class="kv"><u>duty</u> applied</span>', 0.1, 70)}<em class="ok a" style="--k:var(--r2)">✓</em></div><i class="wire" style="--k:var(--r2)"><s></s></i>
<div class="node"><small>Lead time</small>${slot('rd', '<b class="big">7 weeks</b><span class="kv">from live capacity</span>', 0.2, 60)}<em class="ok a" style="--k:var(--r3)">✓</em></div><i class="wire" style="--k:var(--r3)"><s></s></i>
<div class="node"><small>Quote</small>${slot('rd', '<b class="big">Q-0931</b><span class="kv">PDF sent to designer</span>', 0.3, 70)}<em class="ok a" style="--k:var(--r3)">✓</em></div></div></div>`,
    ai: `<div class="u-ai"><div class="hd"><b>Concierge</b><small>knows every piece, finish and room size</small></div><div class="cols">
<div class="chatcol">${chat('me', 'Which piece for a 3.2 m dining table?', 'a', 0.05)}${chat('ai', 'Orla Linear 120, hung 75 cm above the table. Two Pendant 42 also work.', 'a', 0.5)}${slot('chatph', '', 0, 80)}</div>
<div class="fc room"><small>Suggested</small>${slot('fcv', '<b>Orla Linear 120</b><i>over a 3.2 m table</i>', 0.3, 80)}<span class="rm a" style="--bd:0.55">${room}</span></div></div></div>`,
  },
};

export function surfaceHTML(briefId: string, key: SurfaceKey): string {
  return (SURF[briefId] ?? SURF.bakery)[key];
}
