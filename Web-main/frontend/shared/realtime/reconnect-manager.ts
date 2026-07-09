export class ReconnectManager {
  private attempts = 0;
  nextDelay() { this.attempts += 1; return Math.min(30000, 1000 * 2 ** this.attempts); }
  reset() { this.attempts = 0; }
}
