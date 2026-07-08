import { CheckInResult } from '../../../components/ticket/check-in-result';
import { ScanResult } from '../../../components/ticket/scan-result';
export default function DriverCheckInPage() { return <main className="min-h-screen bg-secondary px-4 py-12"><section className="mx-auto max-w-3xl space-y-6"><h1 className="font-display text-4xl font-bold text-slate-950">Driver Check-in</h1><ScanResult /><CheckInResult /></section></main>; }
