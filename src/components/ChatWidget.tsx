import { Bot, LoaderCircle, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { aiAvailable, askAssistant, MAX_INPUT_CHARS, type ChatTurn } from '../ai/assistant';
import { buildKnowledgeEntries, matchQuestion } from '../ai/knowledge';
import { useSiteData } from '../data/SiteData';
import { SlidingWindowLimiter } from '../lib/rateLimit';
import { generalEnquiryMessage } from '../lib/whatsapp';
import { WhatsAppLink } from './ui';

interface Msg extends ChatTurn {
  /** Show a WhatsApp hand-off button under this reply. */
  handoff?: boolean;
}

const limiter = new SlidingWindowLimiter('shs-chat-hits', 15, 10 * 60 * 1000);

const SUGGESTIONS = ['What treatments do you offer?', 'How do I book?', 'Do you offer home service?', 'Where are you located?'];

export default function ChatWidget() {
  const data = useSiteData();
  const { settings } = data;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const knowledge = useMemo(
    () => ({ settings, services: data.services, products: data.products.filter((p) => !p.placeholder), faqs: data.faqs, promotions: data.promotions }),
    [settings, data.services, data.products, data.faqs, data.promotions],
  );
  const entries = useMemo(() => buildKnowledgeEntries(knowledge), [knowledge]);

  const greeting = aiAvailable
    ? `Hi! I'm the ${settings.spaName} assistant. Ask me about our treatments, prices, products or how to book.`
    : `Hi! I can answer common questions about ${settings.spaName}. For anything else, message us on WhatsApp.`;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function fallbackAnswer(q: string): Msg {
    if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(q.trim()) && q.trim().split(/\s+/).length <= 3)
      return { role: 'assistant', text: 'Hello! What would you like to know? You can ask about treatments, booking, home service or our location.' };
    if (/\b(treatments?|services?|offer|menu)\b/i.test(q) && data.services.length) {
      return {
        role: 'assistant',
        text: `Our treatments: ${data.services.map((s) => s.name).join(', ')}. Ask about any of them for details, or tap “Book on WhatsApp” on the Treatments page.`,
      };
    }
    const hit = matchQuestion(q, entries);
    if (hit) return { role: 'assistant', text: hit.answer, handoff: true };
    return { role: 'assistant', text: "Sorry, I don't have an answer for that. Please message us on WhatsApp and the team will help.", handoff: true };
  }

  async function send(text: string) {
    const q = text.trim().slice(0, MAX_INPUT_CHARS);
    if (!q || busy) return;
    setInput('');
    const history = messages;
    setMessages((m) => [...m, { role: 'user', text: q }]);

    if (!limiter.tryAcquire()) {
      const mins = Math.ceil(limiter.retryAfterMs() / 60000);
      setMessages((m) => [...m, { role: 'assistant', text: `You've sent a lot of messages. Please try again in about ${mins} minute${mins === 1 ? '' : 's'}, or message us on WhatsApp.`, handoff: true }]);
      return;
    }

    if (!aiAvailable) {
      setMessages((m) => [...m, fallbackAnswer(q)]);
      return;
    }
    setBusy(true);
    try {
      const reply = await askAssistant(knowledge, history, q);
      setMessages((m) => [...m, { role: 'assistant', text: reply, handoff: /whatsapp/i.test(reply) }]);
    } catch (e) {
      console.warn('AI assistant unavailable, using FAQ answers', e);
      const fb = fallbackAnswer(q);
      setMessages((m) => [...m, { ...fb, text: `${fb.text}\n\n(Our AI assistant is unavailable right now, so this is an automatic FAQ answer.)` }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-24 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ivory px-4 text-sm font-medium text-espresso shadow-lg ring-1 ring-linen transition hover:bg-white md:right-6"
        >
          <Bot className="h-5 w-5" aria-hidden />
          Ask us
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label={aiAvailable ? 'Spa assistant chat' : 'Frequently asked questions chat'}
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(36rem,calc(100dvh-1rem))] flex-col overflow-hidden rounded-2xl border border-linen bg-ivory shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
        >
          <header className="flex items-center justify-between bg-espresso px-4 py-3 text-white">
            <div>
              <p className="font-display text-lg leading-tight">{settings.spaName}</p>
              <p className="text-xs text-white/75">{aiAvailable ? 'AI assistant · answers may be imperfect' : 'Automatic FAQ answers'}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Close chat</span>
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            <Bubble role="assistant">{greeting}</Bubble>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-linen bg-white px-3 py-1.5 text-xs text-espresso hover:border-espresso/40">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i}>
                <Bubble role={m.role}>{m.text}</Bubble>
                {m.handoff && (
                  <div className="mt-2">
                    <WhatsAppLink message={generalEnquiryMessage(settings.spaName)} className="btn-whatsapp min-h-9 px-4 py-1.5 text-xs">
                      Message us on WhatsApp
                    </WhatsAppLink>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-xs text-muted" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Thinking…
              </p>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-linen p-3">
            <div className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Your question
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_INPUT_CHARS}
                placeholder="Ask a question…"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary px-4" disabled={busy || !input.trim()}>
                <Send className="h-4 w-4" aria-hidden />
                <span className="sr-only">Send</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              Please don’t share payment or medical details here. Bookings are confirmed only by the spa on WhatsApp.
            </p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: string }) {
  return (
    <p
      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
        role === 'user' ? 'ml-auto rounded-br-md bg-espresso text-white' : 'rounded-bl-md bg-sand text-ink'
      }`}
    >
      {children}
    </p>
  );
}
