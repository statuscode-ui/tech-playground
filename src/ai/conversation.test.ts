import { describe, expect, it } from 'vitest';
import { seedFaqs, seedServices, seedSettings } from '../data/seed';
import { fallbackReply, smallTalkReply } from './conversation';
import { buildKnowledgeEntries } from './knowledge';

const spa = 'Serenity Haven Spa';
const entries = buildKnowledgeEntries({ settings: seedSettings, services: seedServices, products: [], faqs: seedFaqs, promotions: [] });
const reply = (q: string) => fallbackReply(q, { spaName: spa, serviceNames: seedServices.map((s) => s.name), entries });

describe('small talk', () => {
  it.each(['ok', 'OK', 'Okay.', 'alright', 'Alright!', 'k', 'cool', 'got it', 'oh ok', 'fine', 'sounds good', 'noted'])('"%s" gets a friendly follow-up', (q) => {
    const r = smallTalkReply(q, spa)!;
    expect(r.text).toMatch(/anything else/i);
    expect(r.handoff).toBeFalsy();
    expect(r.suggestions?.length).toBeGreaterThan(0);
  });

  it.each(['thanks', 'Thank you!', 'ok thanks', 'thank you so much', 'thx', 'alright thank you'])('"%s" gets "you\'re welcome"', (q) => {
    expect(smallTalkReply(q, spa)!.text).toMatch(/welcome/i);
  });

  it.each(['bye', 'Goodbye', 'no thanks', 'that’s all', 'good night', 'ok bye'])('"%s" gets a goodbye', (q) => {
    expect(smallTalkReply(q, spa)!.text).toMatch(/lovely day/i);
  });

  it('handles greetings, how are you, yes/no, emoji and "are you a bot"', () => {
    expect(smallTalkReply('Hi there', spa)!.text).toMatch(/Hello/);
    expect(smallTalkReply('good morning', spa)!.text).toMatch(/Hello/);
    expect(smallTalkReply('how are you?', spa)!.text).toMatch(/doing well/);
    expect(smallTalkReply('yes please', spa)!.text).toMatch(/What would you like to know/);
    expect(smallTalkReply('no', spa)!.text).toMatch(/No problem/);
    expect(smallTalkReply('👍', spa)!.text).toMatch(/anything else/);
    expect(smallTalkReply('are you a bot?', spa)!.text).toMatch(/website assistant/);
  });

  it('leaves real questions alone', () => {
    for (const q of ['how much is a facial', 'do you do home service', 'where are you located', 'ok how do I book?', 'good massage for back pain?'])
      expect(smallTalkReply(q, spa)).toBeNull();
  });
});

describe('fallbackReply', () => {
  it('still answers real questions from the FAQ', () => {
    expect(reply('How do I book?').text).toMatch(/Book on WhatsApp/);
    expect(reply('ok how do I book?').text).toMatch(/Book on WhatsApp/);
    expect(reply('what treatments do you offer').text).toMatch(/Hot Stone Massage/);
    expect(reply('What services do you have?').text).toMatch(/Hot Stone Massage/);
    expect(reply('menu').text).toMatch(/Hot Stone Massage/);
  });

  it('answers "do you offer home service?" with the home service answer, not the treatment list', () => {
    const r = reply('Do you offer home service?');
    expect(r.text).toMatch(/Transport cost/);
    expect(r.text).not.toMatch(/Our treatments:/);
  });

  it('is gentle when it does not understand, offering topics as well as WhatsApp', () => {
    const r = reply('qwerty blah');
    expect(r.text).toMatch(/not sure I understood/);
    expect(r.handoff).toBe(true);
    expect(r.suggestions?.length).toBeGreaterThan(0);
  });
});
