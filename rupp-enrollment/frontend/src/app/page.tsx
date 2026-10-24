import Link from "next/link";

const steps = [
  ["1", "Create an account", "Register with your email and verify your details."],
  ["2", "Complete your profile", "Enter personal and high-school information."],
  ["3", "Choose a faculty & major", "Pick the program you want to join."],
  ["4", "Apply & upload documents", "Transcript, ID card and photo."],
  ["5", "Take the entrance exam", "Questions are selected for your major."],
  ["6", "Receive your result", "Admitted, waitlisted or not admitted."],
];

export default function Home() {
  return (
    <main>
      <section className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-400">
              Royal University of Phnom Penh
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Enrollment &amp; Entrance Examination System</h1>
            <p className="mt-4 max-w-xl text-white/75">
              Apply for admission, sit your entrance examination and receive your decision — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-lg bg-gold-400 px-5 py-3 text-sm font-bold text-brand-900 hover:bg-gold-500">Apply now</Link>
              <Link href="/login" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold hover:bg-white/10">Sign in</Link>
            </div>
          </div>
          <div className="grid h-40 w-40 shrink-0 place-items-center self-center rounded-full bg-gold-400 text-7xl font-black text-brand-900">
            R
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-8 text-2xl font-bold text-brand-900">How admission works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{n}</div>
              <div className="font-semibold text-slate-900">{t}</div>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
        {/* <p className="mt-10 text-sm text-slate-500">
          University staff: <Link className="font-semibold text-brand-600 underline" href="/login">sign in to the admission office</Link>.
        </p> */}
      </section>
    </main>
  );
}
