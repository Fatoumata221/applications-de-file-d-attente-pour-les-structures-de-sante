import Link from "next/link";

const steps = [
  {
    title: "Choisissez un centre",
    text: "Comparez les centres de santé disponibles près de chez vous et l'affluence en temps réel.",
  },
  {
    title: "Prenez rendez-vous",
    text: "Sélectionnez un service et un créneau libre en quelques secondes, sans appel téléphonique.",
  },
  {
    title: "Suivez votre tour",
    text: "Un ticket virtuel vous indique votre position exacte — venez seulement quand c'est bientôt votre tour.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-primary px-6 pb-24 pt-20 text-white">
        <div className="mx-auto max-w-2xl animate-fade-in-up text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Centres de santé sénégalais
          </p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Votre tour, sans faire la queue.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/80">
            Prenez rendez-vous dans un centre de santé et suivez la file
            d&apos;attente en direct depuis votre téléphone.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-primary-dark transition-transform hover:scale-[1.03]"
            >
              Se connecter
            </Link>
            <Link
              href="/centres"
              className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Voir les centres
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          Comment ça marche
        </h2>
        <div className="mt-8 flex flex-col gap-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="animate-fade-in-up rounded-2xl border border-border bg-surface p-5 shadow-sm"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-serif text-sm font-semibold text-primary-dark">
                  {i + 1}
                </span>
                <h3 className="font-serif text-lg font-semibold text-ink">
                  {step.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="rounded-2xl bg-surface-alt p-8 text-center">
          <h2 className="font-serif text-xl font-semibold text-ink">
            Déjà un compte ?
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Connectez-vous avec votre numéro de téléphone, aucun mot de passe
            à retenir.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Continuer
          </Link>
        </div>
      </section>
    </main>
  );
}
