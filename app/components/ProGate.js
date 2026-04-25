'use client';
import { useRouter } from 'next/navigation';

/* Blurred overlay upgrade prompt for desktop tooltips */
export function ProGateOverlay({ title, description, buttonText, children }) {
  const router = useRouter();
  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <div style={{ filter: 'blur(4px)', opacity: 0.6, pointerEvents: 'none' }}>{children}</div>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        minHeight: 180, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: 8,
        padding: '24px 32px 28px',
        background: 'rgba(26, 22, 18, 0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        borderRadius: 12,
      }}>
        <span style={{ fontSize: 24 }}>{'\u{1F512}'}</span>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Inter', sans-serif" }}>{title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 260, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{description}</div>
        <button onClick={() => router.push('/pro')} style={{
          padding: '10px 24px', borderRadius: 100, background: '#C68A1B', color: '#fff',
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif", marginTop: 4, flexShrink: 0,
        }}>{buttonText || 'Unlock with Pro →'}</button>
      </div>
    </div>
  );
}

/* Modal-style upgrade prompt */
export function ProGateModal({ icon, title, description, buttonText, subtext, onClose }) {
  const router = useRouter();
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.4)', zIndex: 9998,
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 24, padding: '40px 32px',
        maxWidth: 400, width: 'calc(100vw - 48px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 9999,
        textAlign: 'center', fontFamily: "'Inter', sans-serif",
      }}>
        <div onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, fontSize: 18, color: '#b5aa99',
          cursor: 'pointer', lineHeight: 1, padding: 4,
        }}>&times;</div>
        <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }}>{icon}</div>
        <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 800, color: '#1a1612', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#8a7e72', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px', lineHeight: 1.6 }}>{description}</p>
        <button onClick={() => router.push('/pro')} style={{
          padding: '12px 28px', borderRadius: 100, background: '#C68A1B', color: '#fff',
          fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}>{buttonText || 'Unlock with Pro →'}</button>
        {subtext && <p style={{ fontSize: 11, color: '#b5aa99', marginTop: 10 }}>{subtext}</p>}
      </div>
    </>
  );
}
