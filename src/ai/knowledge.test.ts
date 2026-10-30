import { describe, expect, it } from 'vitest';
import { seedFaqs, seedServices, seedSettings } from '../data/seed';
import { systemPrompt } from './assistant';
import { buildKnowledgeEntries, knowledgeForPrompt, matchQuestion } from './knowledge';

const k = { settings: seedSettings, services: seedServices, products: [], faqs: seedFaqs, promotions: [] };
const entries = buildKnowledgeEntries(k);

describe('FAQ fallback matcher', () => {
  it.each([
    ['How do I book an appointment?', 'How do I book an appointment?'],
    ['can you come to my house', 'Home service'],
    ['what time do you open on sunday', 'Opening hours'],
    ['how much is hot stone massage', 'Hot Stone Massage'],
    ['what is your phone number', 'Contact'],
  ])('%s → %s', (q, topic) => {
    expect(matchQuestion(q, entries)?.topic).toBe(topic);
  });
  it('returns null when nothing matches', () => {
    expect(matchQuestion('what is the capital of France', entries)).toBeNull();
  });
  it('says hours are unknown instead of inventing them', () => {
    expect(matchQuestion('opening hours', entries)?.answer).toMatch(/aren’t listed/);
  });
});

describe('AI prompt', () => {
  it('marks missing information as NOT PROVIDED and includes guardrails', () => {
    const text = knowledgeForPrompt(k);
    expect(text).toContain('Opening hours: NOT PROVIDED');
    expect(text).toContain('Hot Stone Massage');
    expect(text).toContain('price on request');
    const sys = systemPrompt(k);
    expect(sys).toMatch(/Never invent/);
    expect(sys).toMatch(/cannot make, change or confirm bookings/);
    expect(sys).toMatch(/Do not diagnose/);
  });
});
