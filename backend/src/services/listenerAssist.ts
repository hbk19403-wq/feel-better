import Anthropic from '@anthropic-ai/sdk';
import { buildSupportContext, detectCrisis, CRISIS_RESOURCES } from './supportKnowledge';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AssistMessage {
  role: 'user' | 'assistant' | 'listener';
  content: string;
}

export interface AssistResult {
  feeling: string;
  tone: { primary: string; secondary: string; intensity: 'low' | 'medium' | 'high' };
  canSay: string[];
  avoid: string[];
  followUp: string[];
  riskPresent: boolean;
  escalate: boolean;
  escalationReason: string;
  recommendedPath: string;
  crisis_resources?: typeof CRISIS_RESOURCES;
}

const ASSIST_SYSTEM =
  'You are a quiet safety-net assistant supporting a human listener on a confidential emotional-support line. ' +
  'You never speak to the caller. You read the conversation and give the listener brief, practical guidance so they can stay warm and present. ' +
  'You are not a clinician and do not diagnose. Respond with ONLY a JSON object, no markdown, no prose, in exactly this shape: ' +
  '{"feeling": string, "tone": {"primary": string, "secondary": string, "intensity": "low"|"medium"|"high"}, ' +
  '"canSay": string[], "avoid": string[], "followUp": string[], ' +
  '"riskPresent": boolean, "escalate": boolean, "escalationReason": string, "recommendedPath": string}. ' +
  '"feeling" is a short phrase naming the caller\'s likely emotional state. ' +
  '"tone.primary"/"tone.secondary" are single emotion words (e.g. sad, anxious, ashamed, lonely, angry, numb, hopeful). ' +
  '"canSay" is 2-3 short warm validating things the listener could say next (one sentence each). ' +
  '"avoid" is 2-3 short things the listener should NOT say (minimizing, advice-giving, toxic positivity). ' +
  '"followUp" is 1-2 gentle open questions the listener could ask. ' +
  '"riskPresent" is true if there is any sign of self-harm, harm to others, abuse, or acute distress. ' +
  '"escalate" is true only if the situation needs immediate crisis resources or emergency help. ' +
  '"escalationReason" is a short phrase if escalate is true, else empty string. ' +
  '"recommendedPath" is one of: "Continue with live listener", "Offer peer follow-up", "Recommend wellness coach", "Recommend licensed therapist", "Recommend psychiatrist", "Trigger crisis protocol".';

function speaker(role: AssistMessage['role']): string {
  if (role === 'user') return 'CALLER';
  return 'LISTENER';
}

/**
 * Runs the listener-assist safety net over a conversation. The crisis regex is
 * authoritative — a detected risk is never downgraded by the model.
 */
export async function generateAssist(
  rawMessages: AssistMessage[],
  opts: { ageGroupId?: string; topicId?: string } = {}
): Promise<AssistResult> {
  const clean = (rawMessages || [])
    .filter(m => (m?.role === 'user' || m?.role === 'assistant' || m?.role === 'listener') && typeof m?.content === 'string')
    .slice(-24)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

  const lastCaller = [...clean].reverse().find(m => m.role === 'user');
  const crisis = lastCaller ? detectCrisis(lastCaller.content) : false;

  const transcript = clean.map(m => `${speaker(m.role)}: ${m.content}`).join('\n');
  const supportContext = buildSupportContext({ ageGroupId: opts.ageGroupId, topicId: opts.topicId, mode: 'vent', channel: 'chat' });

  let guidance: any = {};
  try {
    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: `${ASSIST_SYSTEM}${supportContext}`,
      messages: [{ role: 'user', content: `Here is the conversation so far. Give the listener guidance.\n\n${transcript}` }],
    });
    const raw = (completion.content[0] as any).text as string;
    const match = raw.match(/\{[\s\S]*\}/);
    guidance = match ? JSON.parse(match[0]) : {};
  } catch {
    guidance = {};
  }

  const strArr = (v: any, n: number): string[] =>
    Array.isArray(v) ? v.filter((s: any) => typeof s === 'string').slice(0, n) : [];

  const tone = guidance.tone && typeof guidance.tone === 'object' ? guidance.tone : {};
  const riskPresent = crisis || guidance.riskPresent === true;
  const escalate = crisis || guidance.escalate === true;

  return {
    feeling: typeof guidance.feeling === 'string' ? guidance.feeling : 'Unclear — keep listening',
    tone: {
      primary: typeof tone.primary === 'string' ? tone.primary : 'unclear',
      secondary: typeof tone.secondary === 'string' ? tone.secondary : '',
      intensity: ['low', 'medium', 'high'].includes(tone.intensity) ? tone.intensity : 'medium',
    },
    canSay: strArr(guidance.canSay, 3),
    avoid: strArr(guidance.avoid, 3),
    followUp: strArr(guidance.followUp, 2),
    riskPresent,
    escalate,
    escalationReason: escalate
      ? (typeof guidance.escalationReason === 'string' && guidance.escalationReason) ||
        (crisis ? 'Possible self-harm or crisis language detected' : 'Situation may need immediate support')
      : '',
    recommendedPath: escalate
      ? 'Trigger crisis protocol'
      : (typeof guidance.recommendedPath === 'string' && guidance.recommendedPath) || 'Continue with live listener',
    crisis_resources: escalate ? CRISIS_RESOURCES : undefined,
  };
}

/**
 * Generates a post-call summary for the listener's after-call documentation.
 */
export async function generateSummary(
  rawMessages: AssistMessage[],
  opts: { ageGroupId?: string; topicId?: string } = {}
): Promise<{ summary: string; emotions: string[]; riskLevel: 'low' | 'medium' | 'high'; recommendedFollowUp: string }> {
  const clean = (rawMessages || [])
    .filter(m => typeof m?.content === 'string')
    .slice(-40)
    .map(m => `${speaker(m.role)}: ${m.content.slice(0, 4000)}`)
    .join('\n');

  let out: any = {};
  try {
    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system:
        'You summarize a confidential emotional-support call for the listener\'s private notes. You are not a clinician. ' +
        'Respond with ONLY JSON: {"summary": string (2-3 sentences), "emotions": string[], "riskLevel": "low"|"medium"|"high", "recommendedFollowUp": string}. ' +
        'Do not include personal judgments or accusations as fact.',
      messages: [{ role: 'user', content: `Summarize this session:\n\n${clean}` }],
    });
    const raw = (completion.content[0] as any).text as string;
    const match = raw.match(/\{[\s\S]*\}/);
    out = match ? JSON.parse(match[0]) : {};
  } catch {
    out = {};
  }

  return {
    summary: typeof out.summary === 'string' ? out.summary : 'No summary available.',
    emotions: Array.isArray(out.emotions) ? out.emotions.filter((s: any) => typeof s === 'string').slice(0, 6) : [],
    riskLevel: ['low', 'medium', 'high'].includes(out.riskLevel) ? out.riskLevel : 'low',
    recommendedFollowUp: typeof out.recommendedFollowUp === 'string' ? out.recommendedFollowUp : '',
  };
}
