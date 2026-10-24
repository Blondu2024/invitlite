import { useEffect, useMemo, useRef, useState } from 'react';
import { music, MUSIC_LABEL, type Music } from '../inv/music';
import { sound, type Sound } from '../inv/sound';
import { starter } from '../inv/defaults';
import { CATEGORIES, KINDS, kindsIn } from '../inv/kinds';
import { FONTS, fontFaces, THEMES, TINTS } from '../inv/theme';
import { stockPhoto } from '../inv/render';
import { waNumber } from '../inv/rsvp';
import { photoLinkHint, safePhotoUrl } from '../inv/sanitize';
import { FONT_IDS, LIMITS, PICS, TINT_IDS, MUSIC_IDS, TEMPLATE_IDS, type Invitation, type Moment, type MusicId } from '../inv/types';
import { invitationUrl } from '../inv/link';
import { initialInvitation, persist } from './store';
import { canDelete, deletePhoto, PHOTO_API, uploadPhoto } from './upload';
import { Preview } from './Preview';
import { Share } from './Share';

type Tab = 'form' | 'look' | 'send';

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

function PhotoField({ value, date, onChange }: { value: string; date: string; onChange: (v: string) => void }) {
  const [state, setState] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pickRef = useRef<HTMLInputElement>(null);
  const url = safePhotoUrl(value);
  const hint = photoLinkHint(value);
  const ours = !!PHOTO_API && value.startsWith(`${PHOTO_API}/p/`);
  useEffect(() => setState('idle'), [url]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setBusy(true);
    try {
      onChange((await uploadPhoto(file, date)).url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (pickRef.current) pickRef.current.value = '';
    }
  };
  const remove = async () => {
    if (canDelete(value)) await deletePhoto(value);
    onChange('');
  };

  return (
    <div className="f photo-f">
      <span className="f-l">Poza voastră (opțional)</span>
      {PHOTO_API && (
        <div className="up">
          <input ref={pickRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <button type="button" className="up-b" disabled={busy} onClick={() => pickRef.current?.click()}>
            {busy ? 'Se pregătește și se urcă...' : value ? 'Alege altă poză' : 'Alege o poză de pe telefon sau PC'}
          </button>
          {value && (
            <button type="button" className="listen" onClick={remove}>
              {ours ? 'Scoate poza' : 'Scoate linkul'}
            </button>
          )}
        </div>
      )}
      {err && <span className="f-h f-warn">{err}</span>}
      {!value && <span className="f-h">Fără poza voastră, invitația folosește fotografia aleasă mai sus. Cu poza voastră, o înlocuiește.</span>}
      {ours && <span className="f-h">Poza e micșorată și fără datele ascunse din ea (locul, telefonul). O păstrăm doar pentru invitație și se șterge singură la 30 de zile după eveniment.</span>}
      {hint && !ours && <span className="f-h f-warn">{hint}</span>}
      {url && (
        <div className="photo-prev">
          <img
            src={url}
            alt=""
            referrerPolicy="no-referrer"
            onLoad={() => setState('ok')}
            onError={() => setState('bad')}
            style={state === 'bad' ? { display: 'none' } : undefined}
          />
          {state === 'ok' && !ours && <span className="f-h">Poza se vede. Așa o vor vedea și invitații.</span>}
          {state === 'bad' && (
            <span className="f-h f-warn">Poza nu se încarcă de la acest link. Invitația va arăta fără poză până pui un link bun.</span>
          )}
        </div>
      )}
      <details className="howto" open={!PHOTO_API && !value ? true : undefined}>
        <summary>{PHOTO_API ? 'Ai poza deja pe internet? Pune linkul ei' : 'Cum pun o poză?'}</summary>
        <label className="f">
          <span className="f-l">Linkul pozei</span>
          <input type="url" inputMode="url" value={ours ? '' : value} maxLength={LIMITS.photo} placeholder="https://i.postimg.cc/..." onChange={(e) => onChange(e.target.value)} />
        </label>
        <ol>
          <li>Intră pe postimages.org (gratuit, fără cont) și apasă „Choose images".</li>
          <li>Alege poza din telefon. După ce se urcă, copiază „Direct link" (începe cu https://i.postimg.cc/).</li>
          <li>Lipește-l aici.</li>
        </ol>
      </details>
    </div>
  );
}

/** The photograph, the colour and the face: one invitation, many versions. */
function LookField({ inv, set }: { inv: Invitation; set: <K extends keyof Invitation>(k: K) => (v: Invitation[K]) => void }) {
  // the face buttons are written in their own face, so the editor needs them too
  useEffect(() => {
    if (document.getElementById('look-fonts')) return;
    const st = document.createElement('style');
    st.id = 'look-fonts';
    st.textContent = fontFaces(location.origin);
    document.head.append(st);
  }, []);
  const night = inv.template === 'seara';
  const base = THEMES[inv.template];
  const sample = inv.hosts.trim() || KINDS[inv.kind].hint;
  return (
    <>
      <div className="grp">
        <h2 className="grp-t">Fotografia</h2>
        <div className="pics" role="radiogroup" aria-label="Fotografia">
          {Array.from({ length: PICS }, (_, i) => (
            <button
              key={`${inv.kind}-${i}`}
              type="button"
              role="radio"
              aria-checked={inv.pic === i}
              aria-label={`Fotografia ${i + 1}`}
              className={inv.pic === i ? 'pic on' : 'pic'}
              onClick={() => set('pic')(i)}
            >
              <img src={stockPhoto(inv.kind, '', 'p', i)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
        <p className="f-h">{inv.photo ? 'Acum se vede poza voastră. Golește câmpul „Poza voastră" de mai jos ca să folosești una de aici.' : 'Cinci fotografii alese pentru acest tip. Poți pune și poza voastră, mai jos.'}</p>
      </div>

      <div className="grp">
        <h2 className="grp-t">Culoarea</h2>
        <div className="tints" role="radiogroup" aria-label="Culoarea">
          {(['', ...TINT_IDS] as const).map((id) => {
            const c = id ? (night ? TINTS[id].night : TINTS[id].deep) : base.deep;
            const label = id ? TINTS[id].label : 'A stilului';
            return (
              <button key={id || 'base'} type="button" role="radio" aria-checked={inv.tint === id} aria-label={label} title={label} className={inv.tint === id ? 'tint on' : 'tint'} onClick={() => set('tint')(id)}>
                <span style={{ background: c }} />
              </button>
            );
          })}
        </div>
        <p className="f-h">{inv.tint ? TINTS[inv.tint].label : `A stilului ${base.label}`}. Colorează titlurile mici, confirmarea și citatul.</p>
      </div>

      <div className="grp">
        <h2 className="grp-t">Scrisul</h2>
        <div className="fonts" role="radiogroup" aria-label="Fontul numelor">
          {(['', ...FONT_IDS] as const).map((id) => (
            <button key={id || 'base'} type="button" role="radio" aria-checked={inv.font === id} className={inv.font === id ? 'font on' : 'font'} onClick={() => set('font')(id)}>
              <span className="font-s" style={{ fontFamily: id ? FONTS[id].stack : base.display }}>
                {sample}
              </span>
              <span className="font-n">{id ? FONTS[id].label : 'Al stilului'}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Background music: pick a tune, listen to it here, or leave the invitation quiet. */
function MusicField(props: { value: Invitation['music']; onChange: (v: Invitation['music']) => void }) {
  const { value, onChange } = props;
  const player = useRef<{ snd: Sound; tune: Music; id: MusicId } | null>(null);
  const [listening, setListening] = useState(false);

  const stop = () => {
    player.current?.tune.stop();
    setListening(false);
  };
  const listen = (id: MusicId) => {
    let p = player.current;
    p?.tune.stop();
    const snd = p?.snd ?? sound(window, { remember: false });
    if (!snd) return;
    p = { snd, tune: music(snd, window, id), id };
    player.current = p;
    p.tune.start();
    setListening(true);
  };
  useEffect(() => () => player.current?.tune.stop(), []);

  const pick = (id: Invitation['music']) => {
    onChange(id);
    if (listening) {
      if (id) listen(id);
      else stop();
    }
  };

  return (
    <div className="grp">
      <h2 className="grp-t">Muzica de fundal</h2>
      <div className="chips" role="radiogroup" aria-label="Muzica de fundal">
        {(['', ...MUSIC_IDS] as const).map((id) => (
          <button key={id || 'none'} type="button" role="radio" aria-checked={value === id} className={value === id ? 'chip on' : 'chip'} onClick={() => pick(id)}>
            {id ? MUSIC_LABEL[id].name : 'Fără'}
          </button>
        ))}
      </div>
      {value ? (
        <p className="f-h">
          {MUSIC_LABEL[value].mood[0].toLocaleUpperCase('ro') + MUSIC_LABEL[value].mood.slice(1)}. Compusă pentru INVITLITE, fără drepturi de plătit. Pornește doar când invitatul deschide plicul și are buton de oprit.{' '}
          <button type="button" className="listen" onClick={() => (listening ? stop() : listen(value))}>
            {listening ? 'Oprește' : 'Ascultă'}
          </button>
        </p>
      ) : (
        <p className="f-h">Invitația se deschide în liniște, doar cu efectele scurte ale scenei.</p>
      )}
    </div>
  );
}

export function Editor() {
  const [inv, setInv] = useState<Invitation>(() => initialInvitation(location.hash, location.search));
  const [cat, setCat] = useState(() => KINDS[inv.kind].cat);
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
            <div className="cats" role="tablist" aria-label="Categoria">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'cat on' : 'cat'} onClick={() => setCat(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="chips" role="radiogroup" aria-label="Tipul evenimentului">
              {kindsIn(cat).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={inv.kind === k}
                  className={inv.kind === k ? 'chip on' : 'chip'}
                  onClick={() => inv.kind !== k && setInv((p) => starter(k, p))}
                >
                  {KINDS[k].chip}
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

          <LookField inv={inv} set={set} />

          <MusicField value={inv.music} onChange={set('music')} />

          <div className="grp">
            <h2 className="grp-t">Cine și când</h2>
            {inv.kind === 'film' && (
              <Text label="Ce vedem (titlul serii)" value={inv.title} max={LIMITS.title} onChange={set('title')} placeholder="Maraton de comedii vechi" hint="Apare mare pe bilet. Poate fi orice, nu trebuie să fie numele unui film." />
            )}
            <Text label={KINDS[inv.kind].who} value={inv.hosts} max={LIMITS.hosts} onChange={set('hosts')} placeholder={KINDS[inv.kind].hint} hint={/&/.test(KINDS[inv.kind].hint) ? 'Pune „&" între nume pentru așezarea frumoasă.' : undefined} />
            <div className="two">
              <label className="f">
                <span className="f-l">Data</span>
                <input type="date" value={inv.date} onChange={(e) => set('date')(e.target.value)} />
              </label>
              <Text label="Orașul" value={inv.city} max={LIMITS.city} onChange={set('city')} placeholder="Galați" />
            </div>
            <PhotoField value={inv.photo} date={inv.date} onChange={set('photo')} />
          </div>

          <div className="grp">
            <h2 className="grp-t">Cuvintele voastre</h2>
            <Text label="Invitația" value={inv.intro} max={LIMITS.intro} onChange={set('intro')} rows={3} />
            <Text label="Un citat sau un gând (opțional)" value={inv.message} max={LIMITS.message} onChange={set('message')} rows={3} />
          </div>

          {inv.kind === 'film' ? (
            <div className="grp">
              <h2 className="grp-t">La bufet</h2>
              <Text label="Ce mâncăm și ce bem (opțional)" value={inv.snacks} max={LIMITS.snacks} onChange={set('snacks')} rows={2} placeholder="Popcorn cu unt, pizza făcută în casă și limonadă." />
            </div>
          ) : (
            (KINDS[inv.kind].family || inv.parents || inv.godparents) && (
            <div className="grp">
              <h2 className="grp-t">Familia</h2>
              <Text label="Părinții (opțional)" value={inv.parents} max={LIMITS.parents} onChange={set('parents')} rows={2} placeholder={'Elena și Gheorghe Popa\nMaria și Ion Stan'} />
              <Text label="Nașii (opțional)" value={inv.godparents} max={LIMITS.godparents} onChange={set('godparents')} rows={2} placeholder="Ioana și Andrei Munteanu" />
            </div>
            )
          )}

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
          <a className="replay" href={invitationUrl(location.origin, inv)} target="_blank" rel="noopener">
            Vezi deschiderea, așa cum o văd invitații
          </a>
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
