import { useMemo, useState } from 'react';
import { SAMPLE } from '../inv/defaults';
import { invitationUrl } from '../inv/link';
import { THEMES } from '../inv/theme';
import { TEMPLATE_IDS, type TemplateId } from '../inv/types';
import { Preview } from './Preview';

const SUITE: [string, string][] = [
  ['Invitația', 'Nuntă, botez, cununie sau aniversare, în trei stiluri. Se deschide ca un plic, cu sigiliul vostru.'],
  ['Confirmarea pe WhatsApp', 'Invitatul alege câte persoane vin, câți copii, ce meniu. Ție îți vine un mesaj gata scris. Fără formulare de completat pe altă parte.'],
  ['Invitații personale', 'Scrii lista. Fiecare primește linkul lui, cu „Dragă familia Popescu" pe plic.'],
  ['Programul și harta', 'Biserica, sala, ora. Fiecare loc cu butonul lui de hartă.'],
  ['Calendar și QR', 'Un buton care pune ziua în calendarul invitatului. Un cod QR pentru invitația de hârtie.'],
];

const FAQ: [string, string][] = [
  ['Chiar e gratuit? Unde e capcana?', 'Nu e. Invitația nu stă pe niciun server: tot textul e scris în link, comprimat. Nu avem ce găzdui, deci nu avem ce să vă cerem. Nu există variantă plătită.'],
  ['Cine vede confirmările?', 'Doar tu. Confirmarea pleacă de pe telefonul invitatului direct în WhatsApp-ul tău. Noi nu o vedem și nu o păstrăm.'],
  ['Trebuie să-mi fac cont?', 'Nu. Completezi, vezi, trimiți. Păstrează doar linkul de editare, ca s-o poți modifica mai târziu.'],
  ['Și dacă mai schimb ceva după ce am trimis-o?', 'Se schimbă și linkul, pentru că linkul este invitația. Trimite-l pe cel nou. Cei care au deja linkul vechi văd varianta veche.'],
  ['Merge pentru cei plecați în străinătate?', 'Da. Scrie numărul cu prefix (+44, +39, +45) și confirmările vin oriunde ai fi. Invitații o deschid de pe orice telefon.'],
  ['Pot s-o tipăresc?', 'Da. Primești un cod QR pe care îl pui pe invitația de hârtie. Cine îl scanează ajunge la confirmare.'],
];

export function Landing() {
  const [look, setLook] = useState<TemplateId>('clasic');
  const sample = useMemo(() => ({ ...SAMPLE, template: look }), [look]);
  const [demoMsg, setDemoMsg] = useState('');
  const sampleUrl = useMemo(() => invitationUrl(location.origin, sample, 'Familia Popescu'), [sample]);

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
        <div className="lp-hero-t">
          <p className="kicker">Invitații digitale. Gratuite.</p>
          <h1 className="lp-h1">
            <span className="ln">Invitația</span> <span className="ln">care încape</span>{' '}
            <span className="ln">
              <em>într-un link.</em>
            </span>
          </h1>
          <p className="lp-sub">
            Nuntă, botez, cununie sau aniversare. Invitații confirmă pe WhatsApp dintr-o atingere. Fără cont, fără plată, fără server.
          </p>
          <div className="lp-ctas">
            <a className="cta" href="/creeaza/">
              Fă-ți invitația
            </a>
            <a className="cta-2" href={sampleUrl} target="_blank" rel="noopener">
              Deschide un exemplu
            </a>
          </div>
        </div>
        <div className="lp-hero-v">
          <div className="phone">
            <Preview inv={sample} guest="Familia Popescu" onRsvp={(u) => setDemoMsg(decodeURIComponent(u.split('text=')[1] ?? ''))} title="Exemplu de invitație" />
          </div>
          <div className="lp-looks" role="radiogroup" aria-label="Stilul exemplului">
            {TEMPLATE_IDS.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={look === t} className={look === t ? 'on' : ''} onClick={() => setLook(t)}>
                <span className="dot" style={{ background: THEMES[t].deep }} />
                {THEMES[t].label}
              </button>
            ))}
          </div>
          {demoMsg && (
            <div className="demo-msg" role="status">
              <p className="demo-msg-t">Asta ar primi mirii pe WhatsApp:</p>
              <pre>{demoMsg}</pre>
            </div>
          )}
        </div>
      </section>

      <section className="lp-price">
        <p className="lp-price-big">
          Invitațiile digitale cu confirmare se vând cu <s>300 de lei</s>. <br className="br" />
          Asta costă 0 lei. Și rămâne așa.
        </p>
      </section>

      <section className="lp-sec">
        <h2 className="lp-h2">Ce primești, toată suita</h2>
        <ol className="lp-list">
          {SUITE.map(([t, d], i) => (
            <li key={t}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-how">
        <div className="lp-how-in">
          <h2 className="lp-h2">De ce poate fi gratuită</h2>
          <p className="lp-how-p">
            O invitație obișnuită stă pe serverul cuiva, și serverul costă lunar. A noastră nu stă nicăieri. Tot ce scrii, numele, data, programul, e
            împachetat chiar în link. Când invitatul îl deschide, telefonul lui despachetează invitația. Nu există bază de date care să se
            plătească, să se spargă sau să se închidă peste un an.
          </p>
        </div>
      </section>

      <section className="lp-sec">
        <h2 className="lp-h2">Întrebări</h2>
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
        <h2 className="lp-end-h">Durează cinci minute.</h2>
        <a className="cta light" href="/creeaza/">
          Fă-ți invitația
        </a>
      </section>

      <footer className="lp-foot">
        <p>INVITLITE este un proiect gratuit al ELI-SAMI-TECH S.R.L., CUI 52120263, J2025050145008, București.</p>
        <p>Nu folosim cookie-uri și nu stocăm invitațiile. Fonturile sunt găzduite la noi, nu la Google.</p>
      </footer>
    </div>
  );
}
