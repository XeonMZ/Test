import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

type EchoInstance = Echo<'reverb'>;

declare global { interface Window { Pusher?: typeof Pusher } }

export class EchoManager {
  private echo?: EchoInstance;
  connect() {
    if (typeof window === 'undefined') return undefined;
    window.Pusher = Pusher;
    this.echo ??= new Echo({ broadcaster: 'reverb', key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? '', wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost', wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080), wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080), forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https', enabledTransports: ['ws', 'wss'] });
    return this.echo;
  }
  disconnect() { this.echo?.disconnect(); this.echo = undefined; }
}

export const echoManager = new EchoManager();
