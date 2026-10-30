export interface EnquiryInput {
  name: string;
  contact: string;
  subject: string;
  message: string;
  consent: boolean;
}

export const ENQUIRY_LIMITS = { name: 80, contact: 120, subject: 120, message: 1500 } as const;

/** Validates an enquiry. Mirrors the checks in firestore.rules so users get friendly errors. */
export function validateEnquiry(e: EnquiryInput): Partial<Record<keyof EnquiryInput, string>> {
  const errors: Partial<Record<keyof EnquiryInput, string>> = {};
  const name = e.name.trim();
  const contact = e.contact.trim();
  const message = e.message.trim();
  if (name.length < 2) errors.name = 'Please enter your name.';
  else if (name.length > ENQUIRY_LIMITS.name) errors.name = `Please keep your name under ${ENQUIRY_LIMITS.name} characters.`;
  const isPhone = /^\+?[\d\s()-]{7,20}$/.test(contact);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  if (!isPhone && !isEmail) errors.contact = 'Please enter a phone number or email address so we can reply.';
  if (e.subject.trim().length > ENQUIRY_LIMITS.subject) errors.subject = 'Subject is too long.';
  if (message.length < 5) errors.message = 'Please enter your message.';
  else if (message.length > ENQUIRY_LIMITS.message) errors.message = `Please keep your message under ${ENQUIRY_LIMITS.message} characters.`;
  if (!e.consent) errors.consent = 'Please confirm we may use these details to reply to you.';
  return errors;
}
