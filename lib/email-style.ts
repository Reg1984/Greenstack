/**
 * One house style for every email VERDANT sends — cold outreach, follow-ups and
 * reply drafts. Reg's rules: sound like a person, not a sales bot; never ask for a
 * call; close by simply giving the contact email address.
 */

export const CONTACT_EMAIL = 'info@greenstackai.co.uk'
export const SENDER_NAME = 'Reginald Orme — GreenStack AI'

export const EMAIL_STYLE = `## HOW TO WRITE EMAILS (applies to every email you send)
Write like a thoughtful person writing to one other person — not a marketing email, not a bot.
- Open with something specific to them: their organisation, a programme they run, a published plan or a deadline they face. No "I hope this email finds you well", no "I'm reaching out to".
- Say plainly why you're writing and what GreenStack could help with, in one or two short paragraphs. Use everyday words, short sentences and contractions. No buzzwords ("leverage", "synergy", "cutting-edge", "revolutionise", "game-changer"), no hype, no exclamation marks, no bullet lists, no bold.
- Don't run down competitors or make price claims like "cheaper than the Big Four".
- Do NOT ask for a call or meeting — no "quick call", "15 minutes", "hop on a call", "book a time", "jump on Zoom". Don't push for a reply either.
- The sign-off is added automatically and ends with the contact email address, so don't add your own sign-off, contact line or signature.
- Under 150 words. Subject line: short, specific, lower-key — like a colleague would write it.`

const SIGNOFF = `\n\nBest wishes,\n\nReginald Orme\nGreenStack AI\n\nThis is the email you can contact us on: ${CONTACT_EMAIL}`

const CALL_ASK = /\b(quick|short|brief|15[- ]?min(ute)?s?|20[- ]?min(ute)?s?|30[- ]?min(ute)?s?)\b[^.?!\n]{0,40}\b(call|chat|meeting|zoom|teams)\b|\b(hop|jump|get) on a (call|zoom|teams)\b|\bbook (a|some) (time|call|slot)\b|\bschedule a (call|meeting)\b|\bdiscovery call\b/i

/** Returns a problem description if the body breaks the house rules, otherwise null. */
export function checkEmailBody(body: string): string | null {
  const m = body.match(CALL_ASK)
  if (m) return `It asks for a call or meeting ("${m[0]}"). Rewrite it without any call or meeting request — the sign-off already gives our contact email.`
  return null
}

/** Strip any sign-off the model added anyway, then append the standard one. */
export function withSignoff(body: string): string {
  const trimmed = body
    .replace(/\n+(kind regards|best regards|best wishes|regards|many thanks|thanks|warm regards|cheers),?[\s\S]*$/i, '')
    .trimEnd()
  return trimmed + SIGNOFF
}
