import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { encodeInvitation } from '../inv/codec';
import { invitationUrl } from '../inv/link';
import { eventName } from '../inv/kinds';
import { waShareUrl } from '../inv/rsvp';
import type { Invitation } from '../inv/types';
import { guestNames, loadGuests, saveGuests } from './store';

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function inviteText(inv: Invitation, url: string, guest = ''): string {
  const hi = guest ? `Dragă ${guest}, ` : '';
  return `${hi}vă invităm cu drag la ${eventName(inv.kind, inv.hosts)}. Invitația și confirmarea sunt aici:\n${url}`;
}

function CopyButton({ text, label = 'Copiază' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        if (await copy(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
    >
      {done ? 'Copiat' : label}
    </button>
  );
}

export function Share({ inv, missing, onFix }: { inv: Invitation; missing: string[]; onFix: () => void }) {
  const url = useMemo(() => invitationUrl(location.origin, inv), [inv]);
  const editUrl = useMemo(() => `${location.origin}/creeaza/#${encodeInvitation(inv)}`, [inv]);
  const [qr, setQr] = useState('');
  const [guests, setGuests] = useState(loadGuests);
  const names = useMemo(() => guestNames(guests), [guests]);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 2, width: 560, color: { dark: '#1E1A17', light: '#FFFFFF' } })
      .then((d) => live && setQr(d))
      .catch(() => live && setQr(''));
    return () => {
      live = false;
    };
  }, [url]);

  useEffect(() => saveGuests(guests), [guests]);

  return (
    <div className="send">
      {missing.length > 0 && (
        <div className="warn" role="alert">
          <p>
            Mai lipsește: <b>{missing.join(', ')}</b>.
          </p>
          <button type="button" className="ghost" onClick={onFix}>
            Completează
          </button>
        </div>
      )}

      <div className="grp">
        <h2 className="grp-t">Linkul invitației</h2>
        <p className="lead">Linkul ESTE invitația. Tot ce ai scris e în el, nu pe vreun server. Dacă mai schimbi ceva, trimite linkul nou.</p>
        <div className="linkbox">
          <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Linkul invitației" />
        </div>
        <div className="row">
          <CopyButton text={url} label="Copiază linkul" />
          <a className="btn primary" href={waShareUrl(inviteText(inv, url))} target="_blank" rel="noopener">
            Trimite pe WhatsApp
          </a>
          <a className="btn" href={url} target="_blank" rel="noopener">
            Deschide
          </a>
        </div>
      </div>

      <div className="grp">
        <h2 className="grp-t">Invitații personale</h2>
        <p className="lead">
          Scrie câte un nume pe rând. Fiecare primește linkul lui, cu „Dragă familia Popescu" pe plic și numele deja completat la confirmare.
        </p>
        <label className="f">
          <span className="f-l">Lista invitaților ({names.length})</span>
          <textarea rows={5} value={guests} onChange={(e) => setGuests(e.target.value)} placeholder={'Familia Popescu\nNașii Ioana și Andrei\nTanti Maria'} />
          <span className="f-h">Lista rămâne doar în acest browser.</span>
        </label>
        {names.length > 0 && (
          <ol className="glist">
            {names.map((n) => {
              const g = invitationUrl(location.origin, inv, n);
              return (
                <li key={n}>
                  <span className="g-n">{n}</span>
                  <span className="g-a">
                    <CopyButton text={g} />
                    <a className="btn primary" href={waShareUrl(inviteText(inv, g, n))} target="_blank" rel="noopener">
                      WhatsApp
                    </a>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grp">
        <h2 className="grp-t">Cod QR pentru tipărit</h2>
        <p className="lead">Pune-l pe invitația de hârtie sau pe un afiș la intrare. Se scanează cu camera telefonului.</p>
        {qr ? (
          <div className="qr">
            <img src={qr} alt="Codul QR al invitației" width={240} height={240} />
            <a className="btn" href={qr} download="invitatie-qr.png">
              Descarcă QR-ul
            </a>
          </div>
        ) : (
          <p className="f-h">Invitația are prea mult text pentru un cod QR. Scurtează textele lungi și apare.</p>
        )}
      </div>

      <div className="grp">
        <h2 className="grp-t">Ca s-o poți modifica mai târziu</h2>
        <p className="lead">Păstrează linkul de editare (salvează-l la favorite sau trimite-l ție pe WhatsApp). Fără el, invitația nu mai poate fi modificată, fiindcă nu avem cont și nici server.</p>
        <div className="row">
          <CopyButton text={editUrl} label="Copiază linkul de editare" />
          <a className="btn" href={waShareUrl(`Linkul de editare pentru invitație:\n${editUrl}`)} target="_blank" rel="noopener">
            Trimite-l mie pe WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
