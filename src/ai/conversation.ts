import { matchQuestion, type KnowledgeEntry } from './knowledge';

/** Topics offered as tappable chips when the visitor might want a nudge. */
export const SUGGESTIONS = ['What treatments do you offer?', 'How do I book?', 'Do you offer home service?', 'Where are you located?'];

export interface Reply {
  text: string;
  /** Show the "Message us on WhatsApp" button under this reply. */
  handoff?: boolean;
  /** Show these topics as tappable chips under this reply. */
  suggestions?: string[];
}

const normalize = (q: string) =>
  q
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ACK = new Set(
  'ok okay okey oky k kk alright alrite aight sure cool great nice fine good perfect awesome lovely noted understood gotcha yh yeah ah oh hmm wow amazing excellent right'.split(' '),
);
const ACK_PHRASES = ['got it', 'i see', 'all right', 'sounds good', 'makes sense', 'no problem', 'that is fine', 'thats fine', 'will do'];
const THANKS = new Set('thanks thank thx ty tnx tanx appreciate appreciated you u so much very a lot'.split(' '));
const BYE = ['bye', 'goodbye', 'bye bye', 'see you', 'see ya', 'later', 'good night', 'goodnight', 'take care', 'thats all', 'that is all', 'nothing else', 'no thanks', 'no thank you', 'im good', 'i am good', 'im done'];
const GREETING = /^(hi|hello|hey|hiya|helo|hello there|hi there|good (morning|afternoon|evening|day))\b/;

const onlyWords = (words: string[], vocab: Set<string>) => words.length > 0 && words.every((w) => vocab.has(w));
const isEmojiOnly = (q: string) => q.trim().length > 0 && normalize(q) === '';

/**
 * Replies to everyday conversation ("ok", "thanks", "bye", "how are you"...) so the
 * FAQ assistant answers naturally instead of treating them as unknown questions.
 * Returns null when the message isn't small talk.
 */
export function smallTalkReply(raw: string, spaName: string): Reply | null {
  const q = normalize(raw);
  const words = q.split(' ').filter(Boolean);

  // Emoji-only messages like 👍 or 😊
  if (isEmojiOnly(raw)) return { text: 'Is there anything else I can help you with?', suggestions: SUGGESTIONS };
  if (!words.length) return null;

  if (BYE.some((b) => q === b || q.startsWith(`${b} `) || q.endsWith(` ${b}`)))
    return { text: `Thank you for chatting with ${spaName}! Whenever you’re ready, tap “Book Appointment” to book on WhatsApp. Have a lovely day! 😊` };

  const thanked = words.some((w) => w === 'thanks' || w === 'thank' || w === 'thx' || w === 'ty' || w === 'appreciate' || w === 'appreciated');
  const vocab = new Set([...ACK, ...THANKS]);
  if (thanked && onlyWords(words, vocab)) return { text: 'You’re very welcome! Is there anything else I can help you with?' };

  if (onlyWords(words, ACK) || ACK_PHRASES.includes(q) || (words.length <= 3 && ACK_PHRASES.some((p) => q.startsWith(p))))
    return { text: 'Great! Is there anything else you’d like to know? I can help with treatments, prices, booking or home service.', suggestions: SUGGESTIONS };

  if (/^(how are you|how r u|how are u|hows it going|how is it going|how do you do)\b/.test(q))
    return { text: 'I’m doing well, thank you for asking! How can I help you today?', suggestions: SUGGESTIONS };

  if (GREETING.test(q) && words.length <= 4)
    return { text: 'Hello! 👋 What would you like to know? You can ask about our treatments, prices, booking or home service.', suggestions: SUGGESTIONS };

  if (/^(yes|yeah|yep|yes please|sure please|please)$/.test(q))
    return { text: 'Of course! What would you like to know? Pick a topic below or type your question.', suggestions: SUGGESTIONS };

  if (/^(no|nope|nah|not really|no its fine|no it is fine)$/.test(q))
    return { text: 'No problem! If you think of anything else, just ask. 😊' };

  if (/\b(who are you|what are you|are you (a )?(bot|robot|human|real|person|ai))\b/.test(q))
    return {
      text: `I’m the ${spaName} website assistant. I can answer common questions about our treatments, prices and booking. For anything else, our team is happy to help on WhatsApp.`,
      handoff: true,
    };

  return null;
}

/** Full reply for the FAQ assistant (used when the AI is off or unavailable). */
export function fallbackReply(raw: string, opts: { spaName: string; serviceNames: string[]; entries: KnowledgeEntry[] }): Reply {
  const talk = smallTalkReply(raw, opts.spaName);
  if (talk) return talk;

  // Only for questions asking for the list ("what treatments do you have?"), not e.g.
  // "do you offer home service?", which the FAQ below answers.
  const asksForList =
    /\b(what|which|list|all|your)\b.*\b(treatments?|services?|menu)\b/i.test(raw) ||
    /\bwhat (else )?do you (do|offer|have)\b/i.test(raw) ||
    /^\s*(treatments?|services?|menu|price list)\s*\??\s*$/i.test(raw);
  if (asksForList && opts.serviceNames.length)
    return {
      text: `Our treatments: ${opts.serviceNames.join(', ')}. Ask about any of them for details, or tap “Book on WhatsApp” on the Treatments page.`,
    };

  const hit = matchQuestion(raw, opts.entries);
  if (hit) return { text: hit.answer, handoff: true };

  return {
    text: 'Sorry, I’m not sure I understood that. I can help with our treatments, prices, booking, home service and location. Try one of these, or message our team on WhatsApp.',
    handoff: true,
    suggestions: SUGGESTIONS,
  };
}
