type Entry = { attempts: number; resetAt: number };

// Limits sign-in attempts per email, whatever IP address they come from.
// Unknown emails are counted too, so the limit doesn't reveal which accounts exist.
// Kept in memory: counts reset on restart and are not shared between server instances.
export class SignInLimiter {
  private entries = new Map<string, Entry>();

  constructor(
    private maxAttempts: number,
    private windowMs: number,
    private now: () => number = Date.now,
    private maxEntries = 10_000,
  ) {}

  // Counts an attempt. Returns false when the email is over the limit.
  // Counting happens before the password check, so parallel requests can't slip through.
  attempt(email: string): boolean {
    const key = this.key(email);
    const now = this.now();
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      this.entries.delete(key);
      this.makeRoom(now);
      this.entries.set(key, { attempts: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.attempts >= this.maxAttempts) return false;
    entry.attempts++;
    return true;
  }

  // Call after a successful sign-in.
  reset(email: string) {
    this.entries.delete(this.key(email));
  }

  private key(email: string) {
    return email.trim().toLowerCase().slice(0, 254); // 254 = longest valid email address
  }

  // Keeps memory bounded: entries are in insertion order, so the first ones expire first.
  private makeRoom(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt > now && this.entries.size < this.maxEntries) break;
      this.entries.delete(key);
    }
  }
}
