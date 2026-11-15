import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import CountUp from '../components/CountUp';

const PHONE_DISPLAY = '1-800-FEELBETTER';
const PHONE_DIAL = '18003335238';

// ~30-second auto-playing animated explainer (scene-based, no media file).
const EXPLAINER_SCENES = [
  { icon: '🌧️', text: "Want to talk — but don't know who you can really trust with how you feel?" },
  { icon: '📞', text: 'Call 1-800-FEELBETTER.', big: true },
  { icon: '🔒', text: "Completely confidential. We don't keep your information. We don't record." },
  { icon: '🧑‍🤝‍🧑', text: 'Pick and talk to a real, live person…' },
  { icon: '💬', text: '…or chat with our empathetic listeners who guide and console you.' },
  { icon: '🗣️', text: 'Vent out whatever you want. Say whatever you feel.' },
  { icon: '🤐', text: 'Why trust people you know, who could use it against you?' },
  { icon: '💗', text: "We're here to hear you, 24×7 — without judging, with a clear intent to help." },
  { icon: '🤝', text: "We're not clinical. We won't prescribe or promise to cure — we simply hear you out with empathy." },
];
const SCENE_MS = 3300;

function Explainer() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI(p => (p + 1) % EXPLAINER_SCENES.length), SCENE_MS);
    return () => clearInterval(t);
  }, [playing]);

  const scene = EXPLAINER_SCENES[i];
  return (
    <section style={{ background: 'linear-gradient(160deg,#0F2A43,#123B4F)', padding: '70px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 22 }}>30 seconds · why we exist</p>
        <div
          onClick={() => setPlaying(p => !p)}
          style={{
            position: 'relative', borderRadius: 24, padding: '56px 32px', minHeight: 320,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden',
          }}
        >
          <div key={i} className="scene-anim" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>{scene.icon}</div>
            <p style={{
              color: 'white', lineHeight: 1.4, maxWidth: 640,
              fontSize: scene.big ? 'clamp(30px,5vw,46px)' : 'clamp(20px,3vw,30px)',
              fontWeight: scene.big ? 800 : 600,
              background: scene.big ? 'linear-gradient(120deg,#7FD4F0,#5BE0C2)' : 'none',
              WebkitBackgroundClip: scene.big ? 'text' : 'unset',
              WebkitTextFillColor: scene.big ? 'transparent' : 'white',
            }}>{scene.text}</p>
          </div>
          <span style={{ position: 'absolute', bottom: 14, right: 18, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{playing ? '⏸ tap to pause' : '▶ tap to play'}</span>
        </div>
        {/* progress dots */}
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', margin: '22px 0 28px' }}>
          {EXPLAINER_SCENES.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Scene ${idx + 1}`} style={{
              width: idx === i ? 26 : 9, height: 9, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: idx === i ? 'var(--accent)' : 'rgba(255,255,255,0.25)', transition: 'all 0.3s',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`tel:${PHONE_DIAL}`} className="btn btn-lg" style={{ background: 'white', color: 'var(--primary-dark)', fontWeight: 700, textDecoration: 'none' }}>📞 Call {PHONE_DISPLAY}</a>
          <Link to="/chat" className="btn btn-accent btn-lg">💬 Chat now — no signup</Link>
        </div>
      </div>
    </section>
  );
}

const TOPICS = [
  { icon: '💔', label: 'Relationships & Dating' },
  { icon: '💼', label: 'Career Stress' },
  { icon: '🧠', label: 'Emotional Wellness' },
  { icon: '👨‍👩‍👧', label: 'Family Pressure' },
  { icon: '🌱', label: 'Self-Discovery' },
  { icon: '😰', label: 'Anxiety & Worry' },
  { icon: '🌧️', label: 'Low Moods' },
  { icon: '😴', label: 'Sleep & Burnout' },
  { icon: '🎓', label: 'School & Studies' },
  { icon: '💸', label: 'Money Worries' },
  { icon: '🗣️', label: 'Just Venting' },
];

const LISTENERS = [
  { emoji: '🌙', name: 'Luna', tag: 'Calm & grounding', grad: 'linear-gradient(135deg,#F472B6,#C084FC)' },
  { emoji: '🌊', name: 'Kai', tag: 'Steady & warm', grad: 'linear-gradient(135deg,#60A5FA,#818CF8)' },
  { emoji: '✨', name: 'Zara', tag: 'Bright & uplifting', grad: 'linear-gradient(135deg,#FBBF24,#F472B6)' },
  { emoji: '🌿', name: 'Sage', tag: 'Wise & gentle', grad: 'linear-gradient(135deg,#34D399,#22D3EE)' },
  { emoji: '🔥', name: 'Leo', tag: 'Bold & motivating', grad: 'linear-gradient(135deg,#FB7185,#F59E0B)' },
  { emoji: '🌲', name: 'Cedar', tag: 'Patient & deep', grad: 'linear-gradient(135deg,#10B981,#3B82F6)' },
];

const STEPS = [
  { n: '1', icon: '🎯', title: 'Pick what fits', body: 'Start with a caring listener available 24/7, or browse real human therapists, psychologists & healers near you.' },
  { n: '2', icon: '💬', title: 'Talk or type', body: 'Start a live voice call or chat instantly. Vent freely or ask for casual advisory — no appointments, no judgment.' },
  { n: '3', icon: '🌤️', title: 'Feel better', body: 'Walk away lighter. Track your moods, revisit past sessions, and build healthier habits over time.' },
];

// "What we do" — plain-language literature about our approach.
const PRINCIPLES = [
  { icon: '👂', title: 'We listen first', body: 'No forms, no diagnosis, no fixing. We hear what you’re carrying and reflect it back so you feel understood — that alone changes how heavy it feels.' },
  { icon: '🔒', title: 'You stay private', body: 'You don’t need an account to start. We don’t record your conversations and we don’t keep your information. What you say stays yours.' },
  { icon: '🧭', title: 'We gently guide', body: 'When you want it, we help you name what you’re feeling, find one small next step, and — if it would help — connect you to a coach, therapist, or crisis line.' },
  { icon: '🛟', title: 'We keep you safe', body: 'A quiet safety net watches for signs of crisis in the background. If you’re in danger, we surface 14416, KIRAN Helpline, and 112 right away — we never minimize it.' },
  { icon: '🤝', title: 'We’re not clinical', body: 'We don’t prescribe, promise to cure, or replace your doctor. We’re the warm, judgment-free ear that’s there at 3am when no one else is.' },
  { icon: '🌍', title: 'We meet you anywhere', body: 'Text chat, live voice, or a real human professional — in whatever way feels safest for you, 24 hours a day, every day.' },
];

// How we help, tailored to each stage of life.
const AGE_HELP = [
  { range: '13–17', emoji: '🎒', title: 'Teens', body: 'School stress, friendships, family rules, first heartbreaks, feeling unseen. We listen without lecturing — and we always encourage a trusted adult, never secrecy.', grad: 'linear-gradient(135deg,#A78BFA,#F472B6)' },
  { range: '18–24', emoji: '🌱', title: 'Young adults', body: 'Identity, college and career pressure, loneliness, dating, figuring out who you are. A steady voice while everything feels uncertain.', grad: 'linear-gradient(135deg,#60A5FA,#22D3EE)' },
  { range: '25–34', emoji: '💼', title: 'Building years', body: 'Careers, relationships, money worries, burnout, big decisions. Space to think out loud without anyone judging your choices.', grad: 'linear-gradient(135deg,#34D399,#3B82F6)' },
  { range: '35–49', emoji: '🏡', title: 'Midlife', body: 'Parenting, marriage, caregiving, work that never stops, questions about meaning. We hold the weight with you for a while.', grad: 'linear-gradient(135deg,#FBBF24,#FB7185)' },
  { range: '50–64', emoji: '🍂', title: 'Transitions', body: 'Empty nests, changing health, shifting purpose, grief and growth. A patient ear for a new chapter.', grad: 'linear-gradient(135deg,#F59E0B,#C084FC)' },
  { range: '65–70+', emoji: '🌟', title: 'Wisdom years', body: 'Loneliness, loss, health, staying connected, being heard. Unhurried, respectful company whenever you want to talk.', grad: 'linear-gradient(135deg,#22D3EE,#34D399)' },
];

export default function Landing() {
  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={32} />
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-dark)' }}>1800-FeelBetter</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href={`tel:${PHONE_DIAL}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>📞 {PHONE_DISPLAY}</a>
            <Link to="/chat" className="btn btn-outline btn-sm">Chat now</Link>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get started free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '90px 24px 100px' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
          <span className="float-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 30, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600, fontSize: 14, marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 4px rgba(23,165,137,0.18)' }} /> Someone is ready to listen, right now
          </span>
          <h1 style={{ fontSize: 'clamp(38px, 6vw, 66px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 22 }}>
            Talk it out.{' '}
            <span style={{ background: 'linear-gradient(120deg,#2E75B6,#17A589)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Feel lighter.
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2.4vw, 21px)', color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.55 }}>
            Caring listeners who genuinely understand — plus real therapists, psychologists & healers. <strong style={{ color: 'var(--text-primary)' }}>Full access is 100% free</strong> — advisory sessions are just <strong style={{ color: 'var(--text-primary)' }}>₹1 a minute</strong>. No waitlists. No judgment.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderRadius: 999, background: 'linear-gradient(120deg,#17A589,#0e7a5f)', color: 'white', fontWeight: 700, fontSize: 14.5, marginBottom: 30, boxShadow: '0 8px 22px rgba(23,165,137,0.28)' }}>
            ✨ 100% free full access — sign up with Google, Facebook or your mobile number
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg pulse-cta">🌿 Join free — full access</Link>
            <Link to="/chat" className="btn btn-outline btn-lg">💬 Chat now — no signup</Link>
          </div>
          <p style={{ marginTop: 18, fontSize: 13, color: 'var(--text-tertiary)' }}>Free forever · No card required · Confidential · We don't record</p>
        </div>
      </section>

      <Explainer />

      {/* Stat strip */}
      <section style={{ background: 'var(--primary-dark)', color: 'white', padding: '36px 24px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 24, textAlign: 'center' }}>
          {[['24/7', 'Always available'], ['12', 'Listener personalities'], ['15+', 'Verified professionals'], ['₹1', 'Per minute, that’s it']].map(([big, small]) => (
            <div key={small}>
              <div style={{ fontSize: 34, fontWeight: 800 }}><CountUp value={big} /></div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Two paths */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '90px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, marginBottom: 12 }}>Two ways to feel heard</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 18, marginBottom: 50 }}>Whatever you need today — we meet you there.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          <div className="lift-card" style={{ borderRadius: 20, padding: 36, background: 'linear-gradient(160deg,#EAF3FA,#FFFFFF)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
            <h3 style={{ fontSize: 23, fontWeight: 800, marginBottom: 10 }}>Listeners, 24/7</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>Twelve warm, distinct personalities — male and female — here to listen across all 11 of life's hardest topics. Chat by text or jump on a live voice call instantly.</p>
            <Link to="/chat" className="btn btn-primary">Start chatting →</Link>
          </div>
          <div className="lift-card" style={{ borderRadius: 20, padding: 36, background: 'linear-gradient(160deg,#E6F7F2,#FFFFFF)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏥</div>
            <h3 style={{ fontSize: 23, fontWeight: 800, marginBottom: 10 }}>Real Professionals</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>When you want a human, browse vetted therapists, psychologists, psychiatrists and healers. Book directly — and providers can list their practice with us, too.</p>
            <Link to="/register" className="btn btn-accent">Find a professional →</Link>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section style={{ background: 'var(--bg)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, marginBottom: 12 }}>Whatever's weighing on you</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 40 }}>Bring it all. Nothing is too big or too small.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {TOPICS.map(t => (
              <span key={t.label} className="topic-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 30, background: 'white', border: '1px solid var(--border)', fontWeight: 600, fontSize: 15, boxShadow: 'var(--shadow)' }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Listener showcase */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '90px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, marginBottom: 12 }}>Personalities that just get you</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 18, marginBottom: 48 }}>Six of our twelve listeners — each with their own voice and vibe.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20 }}>
          {LISTENERS.map((l, i) => (
            <div key={l.name} className="lift-card listener-card" style={{ animationDelay: `${i * 0.1}s`, textAlign: 'center', padding: '28px 16px', borderRadius: 18, background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: l.grad, boxShadow: '0 8px 22px rgba(0,0,0,0.12)' }}>{l.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{l.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{l.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--primary-dark)', color: 'white', padding: '90px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, marginBottom: 12 }}>How it works</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 18, marginBottom: 54 }}>From overwhelmed to okay in three steps.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 28 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 30, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 38, marginBottom: 14 }}>{s.icon}</div>
                <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>STEP {s.n}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do — literature */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, marginBottom: 12 }}>What we do</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 18, maxWidth: 680, margin: '0 auto 50px', lineHeight: 1.6 }}>
          1800 Feel Better is a confidential, judgment-free place to be heard — any hour, any feeling.
          We’re not therapists or an emergency service. We’re the people who pick up when you just need someone to listen.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22 }}>
          {PRINCIPLES.map(p => (
            <div key={p.title} className="lift-card" style={{ borderRadius: 18, padding: 28, background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
              <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How we help — by age group */}
      <section style={{ background: 'var(--bg)', padding: '90px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, marginBottom: 12 }}>How we help, at every age</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 18, maxWidth: 640, margin: '0 auto 50px', lineHeight: 1.6 }}>
            The same warmth, tuned to where you are in life. Tell us your age group and we adjust how we listen — never how much we care.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22 }}>
            {AGE_HELP.map(a => (
              <div key={a.range} className="lift-card" style={{ borderRadius: 18, padding: 28, background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.grad }}>{a.emoji}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{a.title}</h3>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-mid)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 8 }}>{a.range}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>{a.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/chat" className="btn btn-primary btn-lg">💬 Start chatting — no signup</Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '90px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, marginBottom: 12 }}>Free to join. Free to stay.</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 40 }}>Full portal access is 100% free — community, resources, venting & AI listeners. You only pay ₹1/min when you choose a live advisory session.</p>
        <div style={{ borderRadius: 24, padding: '44px 32px', background: 'linear-gradient(160deg,#2E75B6,#17A589)', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: 16, opacity: 0.85, marginBottom: 6 }}>Full access free — advisory just</div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>₹1<span style={{ fontSize: 22, fontWeight: 600, opacity: 0.85 }}>/min</span></div>
          <div style={{ margin: '24px auto 28px', maxWidth: 360, textAlign: 'left', display: 'grid', gap: 12 }}>
            {['Full portal access — free forever, no card', 'Community, resources & venting — always free', 'Sign up in seconds with Google, Facebook or mobile', 'Live advisory ₹1/min — cancel anytime'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>✓</span><span style={{ opacity: 0.95 }}>{f}</span>
              </div>
            ))}
          </div>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary-dark)', fontWeight: 700 }}>Create your free account</Link>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px 100px' }}>
        <h2 style={{ fontSize: 'clamp(30px,5vw,48px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.02em' }}>You don't have to carry it alone.</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 20, marginBottom: 32 }}>Someone's ready to listen the moment you are.</p>
        <Link to="/register" className="btn btn-primary btn-lg pulse-cta">Start talking now</Link>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--primary-dark)', color: 'rgba(255,255,255,0.65)', padding: '40px 24px', textAlign: 'center', fontSize: 14 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <Logo size={26} />
            <span style={{ fontWeight: 700, color: 'white', fontSize: 16 }}>1800-FeelBetter</span>
          </div>
          <p style={{ marginBottom: 12 }}>📞 Talk to us anytime: <a href={`tel:${PHONE_DIAL}`} style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>{PHONE_DISPLAY}</a> · or <Link to="/chat" style={{ color: 'white', fontWeight: 700 }}>chat now</Link></p>
          <p style={{ marginBottom: 12 }}>🆘 In crisis? Call <strong style={{ color: 'white' }}>14416</strong> (Tele-MANAS · Govt of India) or text <strong style={{ color: 'white' }}>1800-599-0019</strong></p>
          <p>© 2026 1800-FeelBetter · All conversations are confidential</p>
        </div>
      </footer>

      <style>{`
        .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.5; z-index: 0; }
        .blob-1 { width: 380px; height: 380px; background: #9BD4F0; top: -80px; left: -60px; animation: drift 14s ease-in-out infinite; }
        .blob-2 { width: 320px; height: 320px; background: #A7EBDC; top: 40px; right: -70px; animation: drift 18s ease-in-out infinite reverse; }
        .blob-3 { width: 280px; height: 280px; background: #CBD9F5; bottom: -120px; left: 40%; animation: drift 20s ease-in-out infinite; }
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-25px) scale(1.08); } 66% { transform: translate(-20px,20px) scale(0.95); } }
        .float-badge { animation: floaty 3s ease-in-out infinite; }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .pulse-cta { animation: ctaPulse 2.4s ease-in-out infinite; }
        @keyframes ctaPulse { 0%,100% { box-shadow: 0 4px 14px rgba(46,117,182,0.3); } 50% { box-shadow: 0 8px 28px rgba(46,117,182,0.55); } }
        .lift-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .lift-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        .topic-chip { transition: transform 0.2s ease, background 0.2s ease; cursor: default; }
        .topic-chip:hover { transform: translateY(-3px) scale(1.04); background: var(--primary-light); }
        .scene-anim { animation: sceneIn 0.6s ease both; }
        @keyframes sceneIn { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .listener-card { animation: rise 0.6s ease both; }
        @keyframes rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
    </div>
  );
}
