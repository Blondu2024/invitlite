import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SAMPLE, sampleFor } from '../inv/defaults';
import { roCount } from '../inv/format';
import { invitationUrl } from '../inv/link';
import { rsvpText } from '../inv/rsvp';
import { THEMES } from '../inv/theme';
import { CATEGORIES, KINDS, kindsIn, type SceneKind } from '../inv/kinds';
import { EVENT_KINDS, TEMPLATE_IDS, type EventKind } from '../inv/types';
import { LivePhone } from './LivePhone';
import { Preview } from './Preview';

const SCENES: SceneKind[] = ['nunta', 'botez', 'cununie', 'aniversare', 'copii', 'film'];

const CHIP: Record<SceneKind, string> = {
  nunta: 'Nuntă',
  botez: 'Botez',
  cununie: 'Cununie',
  aniversare: 'Aniversare',
  copii: 'Copii',
  film: 'Film',
};

const OPENINGS: Record<SceneKind, [string, string]> = {
  nunta: ['Nunta', 'Voalul se ridică, cad petale, mirii se desenează în aur, iar inelele se ating cu un clinchet.'],
  botez: ['Botezul', 'Lumină caldă prin vitraliu. Un porumbel trece prin fața ecranului și lasă în urmă numele copilului.'],
  cununie: ['Cununia civilă', 'Un stilou scrie numele voastre în registru, apoi ștampila coboară: DA.'],
  aniversare: ['Aniversarea', 'Confetti la deschidere. Invitatul își pune o dorință și stinge lumânările de pe tort cu degetul.'],
  copii: ['Petrecerea copiilor', 'Trei baloane se ridică. Le spargi și afli ziua, ora și locul.'],
  film: ['Seara de film', 'Se trage cortina, numărătoarea 3, 2, 1, iar invitația devine un bilet cu locul tău în sală.'],
};

const LOOK_NOTE: Record<string, string> = {
  clasic: 'Hârtie fină, roșu de vin, monogramă.',
  botanic: 'Verde de grădină, frunze desenate de mână.',
  seara: 'Albastru de noapte, auriu, cifre mari.',
};

const EXTRAS: [string, string][] = [
  ['Invitații personale', 'Scrii lista. Fiecare primește linkul lui, cu „Pentru Familia Popescu" pe plic.'],
  ['Programul și harta', 'Biserica, sala, ora. Fiecare loc cu butonul lui de hartă.'],
  ['Calendar și QR', 'Un buton pune ziua în calendarul invitatului. Un cod QR pentru invitația de hârtie.'],
  ['Merge oriunde', 'Se deschide pe orice telefon, din WhatsApp, Facebook sau SMS. Confirmările vin și în străinătate, cu prefix.'],
];

const FAQ: [string, string][] = [
  ['Chiar e gratuit? Unde e capcana?', 'Nu e. Invitația nu stă pe niciun server: tot textul e scris în link, comprimat. Nu avem ce găzdui, deci nu avem ce să vă cerem. Nu există variantă plătită.'],
  ['Cine vede confirmările?', 'Doar tu. Confirmarea pleacă de pe telefonul invitatului direct în WhatsApp-ul tău. Noi nu o vedem și nu o păstrăm.'],
  ['Trebuie să-mi fac cont?', 'Nu. Completezi, vezi, trimiți. Păstrează doar linkul de editare, ca s-o poți modifica mai târziu.'],
  ['Muzica și sunetele au drepturi de autor?', 'Nu. Melodiile sunt compuse pentru INVITLITE și le cântă chiar telefonul invitatului. Pornesc doar după ce deschide plicul și se opresc dintr-o atingere.'],
  ['Și dacă mai schimb ceva după ce am trimis-o?', 'Se schimbă și linkul, pentru că linkul este invitația. Trimite-l pe cel nou. Cei care au deja linkul vechi văd varianta veche.'],
  ['Merge pentru cei plecați în străinătate?', 'Da. Scrie numărul cu prefix (+44, +39, +45) și confirmările vin oriunde ai fi. Invitații o deschid de pe orice telefon.'],
  ['Pot pune poza noastră?', 'Da, direct de pe telefon sau calculator. O micșorăm la voi în telefon și îi scoatem datele ascunse (locul, telefonul), apoi o păstrăm doar pentru invitație. Se șterge singură la 30 de zile după eveniment, sau imediat, din editor.'],
  ['Pot s-o tipăresc?', 'Da. Primești un cod QR pe care îl pui pe invitația de hârtie. Cine îl scanează ajunge la confirmare.'],
];

/** The message the host receives in the WhatsApp demo: the real text the app writes. */
const DEMO_RSVP = rsvpText(SAMPLE, {
  name: 'Familia Popescu',
  coming: true,
  adults: 2,
  kids: 1,
  veg: 0,
  message: 'Abia așteptăm! Vă îmbrățișăm.',
});

const ENVELOPE =
  '<svg viewBox="0 0 64 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="2" y="2" width="60" height="40" rx="2"/><path d="M2 4l30 22L62 4"/><circle cx="32" cy="26" r="6" fill="currentColor" stroke="none"/></svg>';

/** The occasions that open with this scene, besides its own. */
const borrowers = (s: SceneKind) => EVENT_KINDS.filter((k) => k !== s && KINDS[k].scene === s);

/** Adds "in" to .rv-l elements as they scroll into view, once. */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv-l'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Mounts its children only once they come near the screen: three previews are heavy on a cheap phone. */
function Lazy({ children, className }: { children: ReactNode; className: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) return setNear(true);
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setNear(true), { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className={className}>
      {near && children}
    </div>
  );
}

export function Landing() {
  const [kind, setKind] = useState<EventKind>('nunta');
  const [round, setRound] = useState(0);
  const [demoMsg, setDemoMsg] = useState('');
  const [occ, setOcc] = useState<EventKind>('logodna');
  const occPh = useRef<HTMLElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const inv = useMemo(() => sampleFor(kind), [kind]);
  const sampleUrl = useMemo(() => invitationUrl(location.origin, inv, 'Familia Popescu'), [inv]);
  useReveal();

  const choose = (k: EventKind) => {
    setKind(k);
    setRound((r) => r + 1);
    setDemoMsg('');
  };
  // On a phone the photograph sits above the index, often off screen: bring it back.
  const pickOcc = (k: EventKind) => {
    setOcc(k);
    const r = occPh.current?.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > innerHeight)) occPh.current!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const tryKind = (k: EventKind) => {
    choose(k);
    hero.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  };

  return (
    <div className="lp">
      <header className="lp-top">
        <a className="brand" href="/">
          INVITLITE
        </a>
        <a className="lp-top-cta" href="/creeaza/">
          Fă-ți invitația
        </a>
      </header>

      <section className="lp-hero">
        <div className="lp-bg" key={kind} style={{ backgroundImage: `url(/img/bg/${kind}-l.webp)` }} aria-hidden="true" />
        <div className="lp-hero-t">
          <p className="kicker">Invitații digitale. Gratuite.</p>
          <h1 className="lp-h1">
            <span className="ln">Invitația</span> <span className="ln">care încape</span>{' '}
            <span className="ln">
              <em>într-un link.</em>
            </span>
          </h1>
          <p className="lp-sub">
            Se deschide ca un plic adevărat, cu scenă, sunet și muzică. Invitații confirmă pe WhatsApp dintr-o atingere. Fără cont, fără plată.
          </p>
          <div className="lp-ctas">
            <a className="cta" href="/creeaza/">
              Fă-ți invitația
            </a>
            <a className="cta-2" href={sampleUrl} target="_blank" rel="noopener">
              Deschide pe tot ecranul
            </a>
          </div>
        </div>

        <div className="lp-hero-v" ref={hero}>
          <p className="try-hint" aria-hidden="true">
            Încearcă. Atinge sigiliul.
          </p>
          <div className="phone live">
            <LivePhone key={`${kind}-${round}`} inv={inv} onRsvp={(u) => setDemoMsg(decodeURIComponent(u.split('text=')[1] ?? ''))} />
          </div>
          <div className="kinds" role="radiogroup" aria-label="Tipul invitației de încercat">
            {SCENES.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => choose(k)}>
                {CHIP[k]}
              </button>
            ))}
            {!(SCENES as EventKind[]).includes(kind) && (
              <button type="button" role="radio" aria-checked className="on">
                {KINDS[kind].chip}
              </button>
            )}
          </div>
          <button type="button" className="again" onClick={() => choose(kind)}>
            Închide plicul la loc
          </button>
          {demoMsg && (
            <div className="demo-msg" role="status">
              <p className="demo-msg-t">Asta ar primi gazda pe WhatsApp:</p>
              <pre>{demoMsg}</pre>
            </div>
          )}
        </div>
      </section>

      <section className="lp-price rv-l" aria-label="Prețul">
        <div className="pr-l">
          <p className="pr-old">
            La alții: <span className="pr-cut">300 de lei</span>
          </p>
          <p className="pr-note">Atât costă de obicei o invitație digitală cu confirmare. La noi rămâne gratuită. Nu există variantă plătită.</p>
        </div>
        <p className="pr-new">
          0<span> lei.</span>
        </p>
      </section>

      <section className="lp-sec">
        <h2 className="lp-h2 rv-l">
          Șase deschideri.
          <br />
          <em>Una pentru fiecare zi.</em>
        </h2>
        <p className="lp-lead rv-l">
          Fiecare tip de invitație se deschide altfel, cu sunetele lui și cu muzică de fundal compusă pentru INVITLITE. Totul pornește doar când invitatul atinge plicul.
        </p>
        <ol className="op-list">
          {SCENES.map((k, i) => (
            <li key={k} className="rv-l">
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="op-ph">
                <img src={`/img/bg/${k}-p.webp`} alt="" loading="lazy" decoding="async" />
              </span>
              <div className="op-t">
                <h3>{OPENINGS[k][0]}</h3>
                <p>{OPENINGS[k][1]}</p>
                {borrowers(k).length > 0 && <p className="op-also">Tot așa se deschid: {borrowers(k).map((b) => KINDS[b].chip).join(', ')}.</p>}
              </div>
              <button type="button" className="op-try" onClick={() => tryKind(k)}>
                Încearcă
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-sec lp-occ">
        <h2 className="lp-h2 rv-l">
          {roCount(EVENT_KINDS.length, 'ocazie', 'ocazii')}.
          <br />
          <em>Toate gratuite.</em>
        </h2>
        <p className="lp-lead rv-l">De la logodnă la tăierea moțului, de la grătarul din curte la întâlnirea de promoție. Fiecare are fotografia, textele și muzica ei, gata scrise. Tu doar le schimbi.</p>
        <div className="occ">
          <div className="occ-idx">
            {CATEGORIES.map((c, i) => (
              <div key={c.id} className="occ-cat rv-l">
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{c.label}</h3>
                <p className="occ-w">
                  {kindsIn(c.id).map((k) => (
                    <button key={k} type="button" className={occ === k ? 'on' : ''} aria-pressed={occ === k} onClick={() => pickOcc(k)}>
                      {KINDS[k].chip}
                    </button>
                  ))}
                </p>
              </div>
            ))}
          </div>
          <figure className="occ-ph" aria-live="polite" ref={occPh}>
            <img key={occ} src={`/img/bg/${occ}-p.webp`} alt="" decoding="async" loading="lazy" />
            <figcaption>
              <b>{KINDS[occ].label}</b>
              <span>{KINDS[occ].intro}</span>
              <span className="occ-go">
                <button type="button" className="op-try light" onClick={() => tryKind(occ)}>
                  Vezi cum se deschide
                </button>
                <a className="occ-make" href={`/creeaza/?tip=${occ}`}>
                  Fă-o pe a ta
                </a>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="lp-wa">
        <div className="wa-in">
          <div className="wa-copy rv-l">
            <h2 className="lp-h2">Confirmările vin singure.</h2>
            <p className="lp-lead">
              Invitatul alege și apasă un buton. Ție îți vine un mesaj gata scris: cine vine, câte persoane, câți copii, ce meniu. Fără tabel de ținut la zi, fără telefoane de dat.
            </p>
          </div>
          <div className="wa-stage rv-l" aria-hidden="true">
            <div className="mini guest">
              <p className="g-t">Ne confirmi prezența?</p>
              <div className="g-yn">
                <span className="g-yes">Da, venim</span>
                <span>Nu putem veni</span>
              </div>
              <p className="g-l">Numele vostru</p>
              <p className="g-f">
                <span className="g-name">Familia Popescu</span>
              </p>
              <div className="g-row">
                <div>
                  <p className="g-l">Adulți</p>
                  <p className="g-f g-n">
                    <span className="g-a1">1</span>
                    <span className="g-a2">2</span>
                  </p>
                </div>
                <div>
                  <p className="g-l">Copii</p>
                  <p className="g-f g-n">
                    <span className="g-k1">0</span>
                    <span className="g-k2">1</span>
                  </p>
                </div>
              </div>
              <p className="g-send">Trimite confirmarea pe WhatsApp</p>
              <span className="mini-cap">Telefonul invitatului</span>
            </div>
            <svg className="wa-path" viewBox="0 0 120 40" fill="none">
              <path d="M4 30C34 2 86 2 116 30" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 5" />
              <path className="wa-run" d="M4 30C34 2 86 2 116 30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" pathLength={1} />
              <path d="M108 22l8 8-11 3" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <div className="mini host">
              <p className="h-head">
                <span className="h-av">FP</span>
                <span>
                  Familia Popescu
                  <small>mesaj nou</small>
                </span>
              </p>
              <div className="h-chat">
                <p className="h-typing">
                  <i />
                  <i />
                  <i />
                </p>
                <p className="h-msg">
                  {DEMO_RSVP}
                  <small>
                    19:42 <b>✓✓</b>
                  </small>
                </p>
              </div>
              <span className="mini-cap">Telefonul vostru</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <h2 className="lp-h2 rv-l">
          Trei stiluri.
          <br />
          <em>Același link.</em>
        </h2>
        <div className="looks3">
          {TEMPLATE_IDS.map((t) => (
            <figure key={t} className="look3 rv-l">
              <Lazy className="look3-ph">
                <Preview inv={{ ...SAMPLE, template: t }} guest="Familia Popescu" onRsvp={() => {}} title={`Stilul ${THEMES[t].label}`} />
              </Lazy>
              <figcaption>
                <b>{THEMES[t].label}</b> {LOOK_NOTE[t]}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="lp-sec lp-extra">
        <h2 className="lp-h2 rv-l">Și tot ce mai trebuie</h2>
        <ol className="lp-list">
          {EXTRAS.map(([t, d], i) => (
            <li key={t} className="rv-l">
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-how">
        <div className="lp-how-in">
          <h2 className="lp-h2 rv-l">De ce poate fi gratuită</h2>
          <div>
            <p className="lp-how-p rv-l">
              O invitație obișnuită stă pe serverul cuiva, și serverul costă lunar. A noastră nu stă nicăieri. Tot ce scrii, numele, data, programul, e împachetat chiar în
              link. Când invitatul îl deschide, telefonul lui despachetează invitația. Nu există bază de date care să se plătească, să se spargă sau să se închidă peste un
              an.
            </p>
            <svg className="how-svg rv-l" viewBox="0 0 560 214" role="img" aria-label="Ce scrii tu intră în link, iar linkul se deschide direct pe telefonul invitatului, fără server la mijloc.">
              <g className="hw-draw" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path className="hd" d="M12 110h120a6 6 0 0 1 6 6v52a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6v-52a6 6 0 0 1 6-6z" pathLength={1} />
                <path className="hd" d="M246 110h68a32 32 0 0 1 0 64h-68a32 32 0 0 1 0-64z" pathLength={1} />
                <path className="hd" d="M436 100h48a12 12 0 0 1 12 12v60a12 12 0 0 1-12 12h-48a12 12 0 0 1-12-12v-60a12 12 0 0 1 12-12z M452 176h16" pathLength={1} />
                <path className="hd" d="M142 142h66 M352 142h66" pathLength={1} />
                <path className="hd" d="M201 135l7 7-7 7 M411 135l7 7-7 7" pathLength={1} />
                <rect x="226" y="10" width="108" height="54" rx="4" strokeDasharray="4 5" opacity=".6" />
                <path className="hd hw-x" d="M262 19l36 36 M298 19l-36 36" pathLength={1} />
              </g>
              <g fill="currentColor" fontSize="17" textAnchor="middle">
                <text x="72" y="148">Ce scrii tu</text>
                <text x="280" y="148">linkul</text>
                <text x="460" y="208" fontSize="15">telefonul invitatului</text>
                <text x="280" y="88" fontSize="14" opacity=".7">niciun server</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <h2 className="lp-h2 rv-l">Întrebări</h2>
        <div className="faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="lp-end">
        <span className="end-env rv-l" dangerouslySetInnerHTML={{ __html: ENVELOPE }} />
        <h2 className="lp-end-h">Durează cinci minute.</h2>
        <a className="cta light" href="/creeaza/">
          Fă-ți invitația
        </a>
      </section>

      <footer className="lp-foot">
        <p>INVITLITE este un proiect gratuit al ELI-SAMI-TECH S.R.L., CUI 52120263, J2025050145008, București.</p>
        <p>Nu folosim cookie-uri și nu stocăm invitațiile. Păstrăm doar pozele pe care le urcați voi, până la 30 de zile după eveniment. Fonturile sunt găzduite la noi, nu la Google.</p>
      </footer>
    </div>
  );
}
