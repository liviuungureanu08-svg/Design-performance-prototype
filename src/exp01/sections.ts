// Everything after the pinned reading: the method (UNDERSTAND → DESIGN → BUILD → AMPLIFY) and "Write yours".
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const CONTACT = 'hello@gabrielsolutions.example'; // PLACEHOLDER (.example is reserved): real address = missing business truth, see evidence doc

export function buildSections() {
  $('#method').innerHTML = `
  <h2 id="method-title">From what you said to <em>something that runs.</em></h2>
  <div class="steps">
    <div class="step"><div class="n">01 · UNDERSTAND</div><h3>The request is rarely the brief.</h3><p>We read what you wrote, what you meant and what it is costing you. We keep the problems and question the solutions you were handed.</p></div>
    <div class="step"><div class="n">02 · DESIGN</div><h3>One system, not four deliverables.</h3><p>Identity, interface and structure drawn together around how your business really moves, so the website, the app and the automations share one logic.</p></div>
    <div class="step"><div class="n">03 · BUILD</div><h3>Engineered to operate.</h3><p>Websites, apps and platforms, with the automation and AI that do the work behind the screen: built, tested and handed over to run.</p></div>
    <div class="step"><div class="n">04 · AMPLIFY</div><h3>It keeps getting sharper.</h3><p>Measured against real use, extended as the business grows, and put in front of the people who should find you.</p></div>
  </div>
  <div class="scope"><span><b>Websites</b></span><span><b>Mobile apps</b></span><span><b>Platforms</b></span><span><b>AI systems</b></span><span><b>Automation</b></span><span><b>Design &amp; visual intelligence</b></span></div>
  <p class="aud">For local businesses, growing companies and premium brands, in any country.</p>`;

  $('#write').innerHTML = `
  <h2 id="write-title">Your sentence is the brief. <em>Write yours.</em></h2>
  <div class="wgrid">
    <div class="ta"><div class="mirror" aria-hidden="true"></div><textarea id="mine" aria-label="Describe your business problem in your own words" placeholder="Tell us the mess. One honest paragraph is enough: what you sell, what keeps going wrong, what you think you need."></textarea></div>
    <div class="read" aria-live="polite">
      <h4>A first read — as you type</h4>
      <div class="chips"><span data-k="site">Website</span><span data-k="app">App / platform</span><span data-k="flow">Automation</span><span data-k="ai">AI</span></div>
      <div id="said"></div>
      <a class="send" id="send" href="mailto:${CONTACT}">Send it to Gabriel Solutions →</a>
      <p class="fine">A keyword read, not a proposal: a real one takes a conversation. Nothing is sent until you press the button and send the email.</p>
    </div>
  </div>`;

  $('#foot').innerHTML = `<div><span class="wm" style="pointer-events:none"><span>Gabriel Solutions</span><i></i></span><br>Websites · Mobile apps · Platforms · AI · Automation · Design &amp; visual intelligence</div><div>Review build · ALFA Generative Intelligence · Experiment 01 v1.1<br>The three briefs above are illustrative; the businesses are invented.</div>`;

  const ta = $<HTMLTextAreaElement>('#mine'), mir = $('.mirror');
  const RULES: { k: 'site' | 'app' | 'flow' | 'ai'; re: RegExp; why: string }[] = [
    { k: 'flow', re: /\b(whatsapp|e-?mails?|spreadsheets?|excel|manual(ly)?|retyp\w*|copy(ing)?[- ]past\w*|paperwork|invoices?|reminders?|follow[- ]?ups?|by hand|repetitive|forms?)\b/i, why: 'work that people re-enter, forward or chase by hand' },
    { k: 'app', re: /\b(track(ing)?|lose track|dashboard|my team|staff|drivers?|dispatch|inventory|stock|schedul\w+|appointments?|bookings?|orders?|portal|logins?|customers? accounts?)\b/i, why: 'something your team or customers need to operate, not just read' },
    { k: 'site', re: /\b(website|web site|site|online|brand|redesign|looks?|landing|shop|store|e-?commerce|visitors?|first impression|feels?)\b/i, why: 'how you are met and understood before anyone talks to you' },
    { k: 'ai', re: /\b(forecast\w*|predict\w*|how much|which one|recommend\w*|questions?|answer\w*|support|chatbot|assistant|personali[sz]\w*|documents?|search|never know|can.?t tell|don.?t know when)\b/i, why: 'repeated judgement or answers that could be learned from your own data' },
  ];
  const GUESS = /[^.!?]*\b(i|we)\b[^.!?]*\b(think|suppose|need|want|were told|am told|should)\b[^.!?]*\b(web ?site|app|redesign|portal|platform|rebrand|logo)\b[^.!?]*[.!?]?/gi;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sync = () => {
    const v = ta.value;
    // mirror: struck guesses + marked signal sentences (so the reader's marks sit under the writer's own words)
    const marks: { s: number; e: number; t: 'del' | 'mark' }[] = [];
    for (const m of v.matchAll(GUESS)) marks.push({ s: m.index!, e: m.index! + m[0].length, t: 'del' });
    for (const m of v.matchAll(/[^.!?\n]+[.!?]?/g)) {
      if (marks.some((x) => m.index! < x.e && m.index! + m[0].length > x.s)) continue;
      if (RULES.some((r) => r.re.test(m[0]))) marks.push({ s: m.index!, e: m.index! + m[0].length, t: 'mark' });
    }
    marks.sort((a, b) => a.s - b.s);
    let out = '', i = 0;
    for (const m of marks) { out += esc(v.slice(i, m.s)) + `<${m.t}>${esc(v.slice(m.s, m.e))}</${m.t}>`; i = m.e; }
    mir.innerHTML = out + esc(v.slice(i)) + '\n';
    const hit = RULES.filter((r) => r.re.test(v.replace(GUESS, ' ')));
    document.querySelectorAll<HTMLElement>('.chips span').forEach((c) => c.classList.toggle('on', hit.some((h) => h.k === c.dataset.k)));
    const guess = v.match(GUESS);
    $('#said').innerHTML = v.trim().length < 12 ? '<p class="set">Start with the mess, not the solution. We will read the rest.</p>'
      : (guess ? `<p class="set">Set aside: “${esc(guess[0].trim().slice(0, 90))}” — a solution someone handed you.</p>` : '') +
        (hit.length ? hit.map((h) => `<p>${{ site: 'Website', app: 'App / platform', flow: 'Automation', ai: 'AI' }[h.k]} — ${h.why}.</p>`).join('') : '<p class="set">Nothing we can name yet. Say what goes wrong, in whatever words you would use.</p>');
    $<HTMLAnchorElement>('#send').href = `mailto:${CONTACT}?subject=${encodeURIComponent('A brief for Gabriel Solutions')}&body=${encodeURIComponent(v)}`;
  };
  ta.addEventListener('input', sync); ta.addEventListener('scroll', () => { mir.scrollTop = ta.scrollTop; }); sync();
}
