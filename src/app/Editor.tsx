import { useEffect, useMemo, useState } from 'react';
import { starter } from '../inv/defaults';
import { KIND_LABEL } from '../inv/format';
import { THEMES } from '../inv/theme';
import { waNumber } from '../inv/rsvp';
import { EVENT_KINDS, LIMITS, TEMPLATE_IDS, type Invitation, type Moment } from '../inv/types';
import { initialInvitation, persist } from './store';
import { Preview } from './Preview';
import { Share } from './Share';

type Tab = 'form' | 'look' | 'send';

const HOSTS_HINT: Record<Invitation['kind'], string> = {
  nunta: 'Ana & Mihai',
  botez: 'Sofia Maria',
  cununie: 'Ana & Mihai',
  aniversare: 'Bunicul Ion, 70 de ani',
};

function Text(props: {
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  type?: string;
  inputMode?: 'tel' | 'text';
}) {
  const { label, value, max, onChange, placeholder, hint, rows, type, inputMode } = props;
  return (
    <label className="f">
      <span className="f-l">{label}</span>
      {rows ? (
        <textarea value={value} maxLength={max} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={type ?? 'text'}
          value={value}
          maxLength={max}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <span className="f-h">{hint}</span>}
    </label>
  );
}

function MomentRow(props: {
  m: Moment;
  i: number;
  count: number;
  onChange: (m: Moment) => void;
  onRemove: () => void;
  onUp: () => void;
}) {
  const { m, i, count, onChange, onRemove, onUp } = props;
  const set = (k: keyof Moment) => (v: string) => onChange({ ...m, [k]: v });
  return (
    <li className="mrow">
      <div className="mrow-head">
        <span className="mrow-n">{String(i + 1).padStart(2, '0')}</span>
        <div className="mrow-tools">
          {i > 0 && (
            <button type="button" className="ghost" onClick={onUp} aria-label="Mută mai sus">
              Mai sus
            </button>
          )}
          {count > 1 && (
            <button type="button" className="ghost" onClick={onRemove}>
              Șterge
            </button>
          )}
        </div>
      </div>
      <div className="mrow-grid">
        <Text label="Ce se întâmplă" value={m.title} max={LIMITS.momentTitle} onChange={set('title')} placeholder="Cununia religioasă" />
        <label className="f f-time">
          <span className="f-l">Ora</span>
          <input type="time" value={m.time} onChange={(e) => set('time')(e.target.value)} />
        </label>
      </div>
      <Text label="Unde" value={m.place} max={LIMITS.place} onChange={set('place')} placeholder="Biserica Sf. Nicolae" />
      <Text label="Adresa" value={m.address} max={LIMITS.address} onChange={set('address')} placeholder="Strada, oraș" />
      <Text
        label="Link de hartă (opțional)"
        value={m.mapUrl}
        max={LIMITS.mapUrl}
        onChange={set('mapUrl')}
        placeholder="https://maps.app.goo.gl/..."
        hint="Dacă îl lași gol, facem noi linkul din adresă."
      />
    </li>
  );
}

export function Editor() {
  const [inv, setInv] = useState<Invitation>(() => initialInvitation(location.hash));
  const [tab, setTab] = useState<Tab>('form');
  const [rsvpDemo, setRsvpDemo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => persist(inv), 250);
    return () => clearTimeout(t);
  }, [inv]);

  const set = <K extends keyof Invitation>(k: K) => (v: Invitation[K]) => setInv((p) => ({ ...p, [k]: v }));

  const setMoment = (i: number, m: Moment) => setInv((p) => ({ ...p, moments: p.moments.map((x, j) => (j === i ? m : x)) }));
  const addMoment = () =>
    setInv((p) => ({ ...p, moments: [...p.moments, { title: '', time: '', place: '', address: '', mapUrl: '' }] }));
  const removeMoment = (i: number) => setInv((p) => ({ ...p, moments: p.moments.filter((_, j) => j !== i) }));
  const upMoment = (i: number) =>
    setInv((p) => {
      const ms = [...p.moments];
      [ms[i - 1], ms[i]] = [ms[i], ms[i - 1]];
      return { ...p, moments: ms };
    });

  const missing = useMemo(() => {
    const out: string[] = [];
    if (!inv.hosts.trim()) out.push('numele');
    if (!inv.date) out.push('data');
    if (!waNumber(inv.rsvpPhone)) out.push('numărul de WhatsApp pentru confirmări');
    return out;
  }, [inv]);

  const showRsvp = (url: string) => {
    const text = decodeURIComponent(url.split('text=')[1] ?? '');
    setRsvpDemo(text);
  };

  return (
    <div className="ed">
      <header className="ed-top">
        <a className="brand" href="/">
          INVITLITE
        </a>
        <nav className="steps" aria-label="Pași">
          {(
            [
              ['form', '1', 'Completează'],
              ['look', '2', 'Vezi'],
              ['send', '3', 'Trimite'],
            ] as const
          ).map(([id, n, label]) => (
            <button key={id} type="button" className={tab === id ? 'on' : ''} aria-current={tab === id} onClick={() => setTab(id)}>
              <span className="steps-n">{n}</span>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className={`ed-body tab-${tab}`}>
        <section className="ed-form" aria-label="Detaliile invitației">
          <div className="grp">
            <h2 className="grp-t">Ce sărbătoriți</h2>
            <div className="chips" role="radiogroup" aria-label="Tipul evenimentului">
              {EVENT_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={inv.kind === k}
                  className={inv.kind === k ? 'chip on' : 'chip'}
                  onClick={() => inv.kind !== k && setInv((p) => starter(k, p))}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <p className="f-h">Schimbarea tipului pune texte de început potrivite. Le poți rescrie oricum.</p>
          </div>

          <div className="grp">
            <h2 className="grp-t">Stilul</h2>
            <div className="looks" role="radiogroup" aria-label="Stilul invitației">
              {TEMPLATE_IDS.map((t) => {
                const th = THEMES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={inv.template === t}
                    className={inv.template === t ? 'look on' : 'look'}
                    onClick={() => set('template')(t)}
                    style={{ background: th.paper, color: th.ink }}
                  >
                    <span className="look-sw" style={{ background: th.deep }} />
                    <span className="look-n" style={{ fontFamily: th.display }}>
                      {th.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grp">
            <h2 className="grp-t">Cine și când</h2>
            <Text label={inv.kind === 'botez' ? 'Numele copilului' : inv.kind === 'aniversare' ? 'Sărbătoritul' : 'Numele mirilor'} value={inv.hosts} max={LIMITS.hosts} onChange={set('hosts')} placeholder={HOSTS_HINT[inv.kind]} hint={inv.kind === 'nunta' || inv.kind === 'cununie' ? 'Pune „&" între nume pentru așezarea frumoasă.' : undefined} />
            <div className="two">
              <label className="f">
                <span className="f-l">Data</span>
                <input type="date" value={inv.date} onChange={(e) => set('date')(e.target.value)} />
              </label>
              <Text label="Orașul" value={inv.city} max={LIMITS.city} onChange={set('city')} placeholder="Galați" />
            </div>
          </div>

          <div className="grp">
            <h2 className="grp-t">Cuvintele voastre</h2>
            <Text label="Invitația" value={inv.intro} max={LIMITS.intro} onChange={set('intro')} rows={3} />
            <Text label="Un citat sau un gând (opțional)" value={inv.message} max={LIMITS.message} onChange={set('message')} rows={3} />
          </div>

          <div className="grp">
            <h2 className="grp-t">Familia</h2>
            <Text label="Părinții (opțional)" value={inv.parents} max={LIMITS.parents} onChange={set('parents')} rows={2} placeholder={'Elena și Gheorghe Popa\nMaria și Ion Stan'} />
            <Text label="Nașii (opțional)" value={inv.godparents} max={LIMITS.godparents} onChange={set('godparents')} rows={2} placeholder="Ioana și Andrei Munteanu" />
          </div>

          <div className="grp">
            <h2 className="grp-t">Programul zilei</h2>
            <ol className="mrows">
              {inv.moments.map((m, i) => (
                <MomentRow
                  key={i}
                  m={m}
                  i={i}
                  count={inv.moments.length}
                  onChange={(x) => setMoment(i, x)}
                  onRemove={() => removeMoment(i)}
                  onUp={() => upMoment(i)}
                />
              ))}
            </ol>
            {inv.moments.length < LIMITS.moments && (
              <button type="button" className="add" onClick={addMoment}>
                Adaugă un moment
              </button>
            )}
          </div>

          <div className="grp">
            <h2 className="grp-t">Confirmările</h2>
            <Text
              label="Numărul tău de WhatsApp"
              value={inv.rsvpPhone}
              max={LIMITS.phone}
              onChange={set('rsvpPhone')}
              placeholder="0722 123 456"
              inputMode="tel"
              hint={
                inv.rsvpPhone && !waNumber(inv.rsvpPhone)
                  ? 'Numărul nu pare complet. Din străinătate, scrie-l cu prefix: +45 ..., +44 ...'
                  : 'Aici îți vin confirmările, ca mesaje. Nu le vede nimeni altcineva.'
              }
            />
            <label className="f">
              <span className="f-l">Confirmări până pe (opțional)</span>
              <input type="date" value={inv.rsvpBy} onChange={(e) => set('rsvpBy')(e.target.value)} />
            </label>
            <label className="tick">
              <input type="checkbox" checked={inv.askKids} onChange={(e) => set('askKids')(e.target.checked)} />
              <span>Întreabă câți copii vin</span>
            </label>
            <label className="tick">
              <input type="checkbox" checked={inv.askMenu} onChange={(e) => set('askMenu')(e.target.checked)} />
              <span>Întreabă de meniul vegetarian</span>
            </label>
          </div>

          <div className="grp">
            <h2 className="grp-t">De știut</h2>
            <Text label="Ținută, parcare, cadouri (opțional)" value={inv.note} max={LIMITS.note} onChange={set('note')} rows={3} placeholder="Ținuta: elegantă. Parcare în curtea restaurantului." />
          </div>

          <button type="button" className="next" onClick={() => setTab('look')}>
            Vezi invitația
          </button>
        </section>

        <section className="ed-look" aria-label="Previzualizare">
          <div className="phone">
            <Preview inv={inv} onRsvp={showRsvp} />
          </div>
          {rsvpDemo && (
            <div className="demo-msg" role="status">
              <p className="demo-msg-t">Așa îți vine confirmarea pe WhatsApp:</p>
              <pre>{rsvpDemo}</pre>
              <button type="button" className="ghost" onClick={() => setRsvpDemo('')}>
                Închide
              </button>
            </div>
          )}
          <button type="button" className="next" onClick={() => setTab('send')}>
            E gata, vreau s-o trimit
          </button>
        </section>

        <section className="ed-send" aria-label="Trimite">
          <Share inv={inv} missing={missing} onFix={() => setTab('form')} />
        </section>
      </div>
    </div>
  );
}
