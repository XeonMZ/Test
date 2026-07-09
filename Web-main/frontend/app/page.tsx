import { Button } from '@/components/button';
import { SectionHeading } from '@/components/section-heading';
import { ArrowRight, CalendarDays, Car, MapPin, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react';

const stats: Array<[string, string]> = [ ['12k+', 'Trips managed'], ['98%', 'On-time arrivals'], ['24/7', 'Operations support'], ['4.9/5', 'Customer rating'] ];
const benefits: Array<[string, string, LucideIcon]> = [
  ['Smart dispatch', 'Match every booking with the right driver, vehicle, and route in seconds.', Car],
  ['Secure journeys', 'Operational oversight, driver workflows, and customer communication built in.', ShieldCheck],
  ['Premium experience', 'A polished booking flow that feels effortless across every device.', Sparkles],
];
const faqs: Array<[string, string]> = [
  ['Can customers book online?', 'Yes. STMS is prepared for a fast customer booking flow with validation-ready forms and API services.'],
  ['Is the platform role based?', 'The foundation includes dedicated customer, driver, admin, and owner route areas.'],
  ['Is this ready for mobile users?', 'The frontend is responsive, accessible, SEO-ready, and configured as a PWA foundation.'],
];

export default function Home() {
  return (
    <div className="overflow-hidden bg-secondary text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <section className="relative px-4 pb-20 pt-36 sm:pt-44">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(22,163,74,0.16),transparent_26%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-soft"><Sparkles size={16} /> Premium travel operations</div>
            <h1 className="mt-7 font-display text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">Travel bookings that feel effortless from request to arrival.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600">STMS brings customer booking, dispatch preparation, driver workflows, and owner visibility into one elegant foundation.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row"><a href="/booking"><Button>Start booking <ArrowRight className="ml-2" size={18} /></Button></a><a href="#solutions" className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 shadow-soft">Explore platform</a></div>
          </div>

          <div id="booking" className="glass-panel rounded-[2rem] p-6 shadow-soft">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white"><p className="font-display text-2xl font-bold">Book your next journey</p><p className="mt-2 text-slate-300">Fast search for routes, schedules, and vehicle options.</p></div>
            <form className="mt-6 grid gap-4" aria-label="Booking search">
              {[['Pickup location', 'Kuala Lumpur'], ['Destination', 'Penang'], ['Travel date', 'Select date']].map(([label, value], index) => (
                <label key={label} className="rounded-2xl bg-white p-4 shadow-sm"><span className="flex items-center gap-2 text-sm font-bold text-slate-500">{index === 2 ? <CalendarDays size={16}/> : <MapPin size={16}/>} {label}</span><input className="mt-2 w-full bg-transparent text-lg font-bold outline-none" defaultValue={value} aria-label={label} /></label>
              ))}
              <Button className="w-full">Search availability</Button>
            </form>
          </div>
        </div>
      </section>

      <section id="solutions" className="px-4 py-20"><SectionHeading eyebrow="Why choose us" title="Built for premium travel teams" description="A clean architecture foundation for reusable features, responsive interfaces, and scalable operations." /><div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-3">{benefits.map(([title, description, Icon]) => <article key={title} className="rounded-[2rem] bg-white p-8 shadow-soft"><Icon className="text-primary" size={34} /><h3 className="mt-6 font-display text-2xl font-bold">{title}</h3><p className="mt-4 leading-7 text-slate-600">{description}</p></article>)}</div></section>

      <section className="px-4 py-12"><div className="mx-auto grid max-w-7xl gap-4 rounded-[2rem] bg-primary p-6 text-white shadow-soft md:grid-cols-4">{stats.map(([value, label]) => <div key={label} className="p-6 text-center"><p className="font-display text-4xl font-extrabold">{value}</p><p className="mt-2 text-blue-100">{label}</p></div>)}</div></section>

      <section id="faq" className="px-4 py-20"><SectionHeading eyebrow="FAQ" title="Ready for the next sprint" description="The foundation is intentionally prepared for booking, authentication, dashboards, and Laravel API integration." /><div className="mx-auto mt-10 max-w-4xl space-y-4">{faqs.map(([q, a]) => <details key={q} className="group rounded-2xl bg-white p-6 shadow-soft"><summary className="cursor-pointer list-none font-display text-xl font-bold">{q}</summary><p className="mt-4 leading-7 text-slate-600">{a}</p></details>)}</div></section>

      <section className="px-4 pb-20"><div className="mx-auto rounded-[2rem] bg-slate-950 p-10 text-center text-white shadow-soft"><Users className="mx-auto text-warning" size={36} /><h2 className="mt-5 font-display text-4xl font-bold">Launch your travel operations hub.</h2><p className="mx-auto mt-4 max-w-2xl text-slate-300">Start with a polished customer experience today and scale into role-based operations tomorrow.</p><a href="/register" className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3 font-bold text-slate-950">Create account</a></div></section>

    </div>
  );
}
