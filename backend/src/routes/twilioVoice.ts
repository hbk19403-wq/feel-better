import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { buildSupportContext, detectCrisis } from '../services/supportKnowledge';

// Twilio Voice webhook. Point a purchased number's "A Call Comes In" webhook at
// POST /twilio/voice. No transcripts are persisted — per-call history is kept in
// memory only and dropped when the call ends, honoring "we don't record".
const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PUBLIC_PERSONA =
  'You are an empathetic AI companion for 1800 Feel Better, speaking with a caller by phone. ' +
  'You are warm, calm, and present. You are not a therapist or doctor: you do not diagnose, prescribe, or promise to fix or cure anything. ' +
  'Speak in short, natural spoken sentences — 1 to 3 sentences. Listen, validate, and gently guide.';

type Turn = { role: 'user' | 'assistant'; content: string };
const callHistory = new Map<string, Turn[]>();

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}

function twiml(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

function gatherBlock(prompt: string): string {
  return (
    `<Gather input="speech" action="/twilio/voice/agent" method="POST" speechTimeout="auto" language="en-US">` +
    `<Say voice="Polly.Joanna">${xmlEscape(prompt)}</Say>` +
    `</Gather>` +
    `<Redirect method="POST">/twilio/voice/agent</Redirect>`
  );
}

// Incoming call → confidential greeting + menu.
router.post('/voice', (_req: Request, res: Response) => {
  const greeting =
    'Thank you for calling 1 800 Feel Better. This call is completely confidential. ' +
    'We do not keep your information and we are not recording you. ' +
    'To talk with a live person, press 1. To talk with our empathetic A I agent, press 2, or just start talking after the tone.';
  const body =
    `<Gather input="dtmf speech" numDigits="1" action="/twilio/voice/route" method="POST" speechTimeout="auto">` +
    `<Say voice="Polly.Joanna">${xmlEscape(greeting)}</Say>` +
    `</Gather>` +
    `<Redirect method="POST">/twilio/voice/route</Redirect>`;
  res.type('text/xml').send(twiml(body));
});

// Route choice: 1 = live person, anything else = AI agent.
router.post('/voice/route', (req: Request, res: Response) => {
  const digit = (req.body?.Digits || '').trim();
  if (digit === '1') {
    const forward = process.env.TWILIO_FORWARD_NUMBER;
    if (forward) {
      const body =
        `<Say voice="Polly.Joanna">Connecting you with a live person now. Please hold.</Say>` +
        `<Dial timeout="25">${xmlEscape(forward)}</Dial>` +
        `<Say voice="Polly.Joanna">We could not reach a live person right now. I am here with you — please tell me what is on your mind.</Say>` +
        `<Redirect method="POST">/twilio/voice/agent</Redirect>`;
      return res.type('text/xml').send(twiml(body));
    }
    const body =
      `<Say voice="Polly.Joanna">No live person is available at the moment, but I am here for you. Tell me what is on your mind, and I will listen.</Say>` +
      gatherBlock('');
    return res.type('text/xml').send(twiml(body));
  }
  res.type('text/xml').send(twiml(gatherBlock("I'm here, and I'm listening. Take your time — what's on your mind?")));
});

// AI agent turn: transcribe (Twilio SpeechResult) → Claude → speak → gather again.
router.post('/voice/agent', async (req: Request, res: Response) => {
  const callSid = req.body?.CallSid || 'unknown';
  const speech = (req.body?.SpeechResult || '').trim();

  if (!speech) {
    return res.type('text/xml').send(twiml(gatherBlock("I didn't quite catch that. Whenever you're ready, tell me what's going on.")));
  }

  try {
    const history = callHistory.get(callSid) || [];
    history.push({ role: 'user', content: speech });

    const crisis = detectCrisis(speech);
    const supportContext = buildSupportContext({ mode: 'vent', channel: 'voice' });
    const crisisDirective = crisis
      ? '\n\nIMPORTANT — the caller may be in crisis. Stay warm, take it seriously, and gently say they can call or text 9 8 8, or call 9 1 1 if they are in immediate danger. Encourage them to reach out to someone they trust right now.'
      : '';

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: `${PUBLIC_PERSONA}${supportContext}${crisisDirective}`,
      messages: history.slice(-12),
    });

    const reply = (completion.content[0] as any).text as string;
    history.push({ role: 'assistant', content: reply });
    callHistory.set(callSid, history.slice(-12));

    res.type('text/xml').send(twiml(gatherBlock(reply)));
  } catch {
    res.type('text/xml').send(twiml(gatherBlock("I'm having a little trouble right now, but I don't want you to feel alone. If this is urgent, please call or text 9 8 8. What else is on your mind?")));
  }
});

// Twilio status callback — clear in-memory history when the call completes.
router.post('/voice/status', (req: Request, res: Response) => {
  const status = req.body?.CallStatus;
  if (status === 'completed' || status === 'failed' || status === 'busy' || status === 'no-answer') {
    callHistory.delete(req.body?.CallSid);
  }
  res.sendStatus(204);
});

export default router;
