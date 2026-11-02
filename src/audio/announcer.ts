// Station announcements and cab radio, voiced with the browser's own speech synthesis (Web
// Speech API; no recordings) and always subtitled. Announcements follow the pattern described
// in docs/IMMERSION_IDEAS.md (station life): Hindi, English and the region's language, in
// that order per route (the real order varies by station: UNVERIFIED, so it is a setting).
// All text is original. The regional (Marathi) lines are drafts that need native review.
import type { Station } from '../sim/types';

export type Lang = 'hi-IN' | 'en-IN' | 'mr-IN';

export interface Line {
  lang: Lang;
  speaker: string;
  text: string;
}

const NUM_HI = ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह'];
const NUM_MR = ['शून्य', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा'];

/** The three-language arrival announcement for the player's train. */
export function arrivalLines(
  train: string,
  dest: Station,
  st: Station,
  platform: number | undefined,
): Line[] {
  const pf = platform ?? 1;
  const name = st.localName ?? st.name;
  const destLocal = dest.localName ?? dest.name;
  return [
    {
      lang: 'hi-IN',
      speaker: 'Station announcement (Hindi)',
      text: `कृपया ध्यान दें। ${destLocal} जाने वाली ${train} प्लेटफ़ॉर्म नंबर ${NUM_HI[pf] ?? pf} पर आ रही है। ${name}।`,
    },
    {
      lang: 'en-IN',
      speaker: 'Station announcement (English)',
      text: `Attention please. The ${train} to ${dest.name} is arriving on platform number ${pf}. Please stand back from the platform edge.`,
    },
    {
      lang: 'mr-IN',
      speaker: 'Station announcement (Marathi, draft)',
      text: `कृपया लक्ष द्या. ${destLocal}ला जाणारी ${train} फलाट क्रमांक ${NUM_MR[pf] ?? pf} वर येत आहे.`,
    },
  ];
}

export function delayLines(train: string, minutes: number): Line[] {
  return [
    {
      lang: 'hi-IN',
      speaker: 'Station announcement (Hindi)',
      text: `कृपया ध्यान दें। ${train} लगभग ${minutes} मिनट देरी से चल रही है। असुविधा के लिए खेद है।`,
    },
    {
      lang: 'en-IN',
      speaker: 'Station announcement (English)',
      text: `The ${train} is running about ${minutes} minutes late. We regret the inconvenience.`,
    },
  ];
}

/** Speaks lines one after another; reports each to `onSubtitle` as it starts. */
export class Announcer {
  onSubtitle: (speaker: string, text: string) => void = () => {};
  private queue: Line[] = [];
  private speaking = false;
  private readonly synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  muted = false;

  say(lines: Line[]): void {
    this.queue.push(...lines);
    if (!this.speaking) this.next();
  }

  /** Cab radio / crew lines: English, spoken at a slightly brisker rate. */
  radio(speaker: string, text: string): void {
    this.say([{ lang: 'en-IN', speaker, text }]);
  }

  stop(): void {
    this.queue = [];
    this.speaking = false;
    this.synth?.cancel();
  }

  private next(): void {
    const line = this.queue.shift();
    if (!line) {
      this.speaking = false;
      return;
    }
    this.speaking = true;
    this.onSubtitle(line.speaker, line.text);
    const voice = this.voiceFor(line.lang);
    if (!this.synth || this.muted || (!voice && line.lang !== 'en-IN')) {
      // No voice for this language on this device: subtitles only, paced by length.
      window.setTimeout(() => this.next(), 1500 + line.text.length * 55);
      return;
    }
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = line.lang;
    if (voice) u.voice = voice;
    u.rate = line.speaker.startsWith('Station') ? 0.92 : 1.05;
    u.onend = () => this.next();
    u.onerror = () => this.next();
    this.synth.speak(u);
  }

  private voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
    const voices = this.synth?.getVoices() ?? [];
    return (
      voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)))
    );
  }
}
