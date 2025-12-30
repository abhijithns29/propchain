import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Layers, Globe2, Users } from 'lucide-react';
import MarketingLayout from '../components/layout/MarketingLayout';

const roadmap = [
  {
    year: '2023',
    title: 'Idea & Research',
    description:
      'Mapping the global land fraud problem and designing a registry that regulators and buyers can trust.',
  },
  {
    year: '2024',
    title: 'Pilot Program',
    description:
      'Deployed pilots with select land authorities and financial institutions to validate the end-to-end workflow.',
  },
  {
    year: '2025',
    title: 'Full Land Registry System',
    description:
      'Scaled to a production-ready registry and marketplace with on-chain verification and smart-contract execution.',
  },
  {
    year: 'Beyond',
    title: 'Interoperable Land Networks',
    description:
      'Connecting jurisdictions and partners into a shared fabric of verifiable land records.',
  },
];

const About: React.FC = () => {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 pb-12 pt-2 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            About PropChain
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Solving Land Fraud with Verifiable, Shared Truth
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            PropChain exists to bridge the gap between traditional land
            registries and modern digital markets, creating a single,
            trustworthy source of property truth.
          </p>
        </motion.div>
      </section>

      {/* Story */}
      <section className="bg-slate-900 py-14 sm:py-18">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl space-y-4"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              The Story Behind PropChain
            </h2>
            <p className="text-sm text-slate-300 sm:text-base">
              In many regions, land registries are fragmented across paper
              archives, disconnected systems, and siloed databases. This makes
              it difficult to establish who truly owns what — and opens the
              door to fraud, disputes, and stalled economic activity.
            </p>
            <p className="text-sm text-slate-300 sm:text-base">
              PropChain was born out of collaboration between technologists,
              policy experts, and registry officials who wanted a more
              verifiable, resilient way to store and share land ownership
              data.
            </p>
            <p className="text-sm text-slate-300 sm:text-base">
              By anchoring records on blockchain and designing workflows
              around existing legal frameworks, PropChain turns land data
              from an opaque liability into a transparent asset.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-md flex-1"
          >
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-slate-900 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl shadow-emerald-500/25 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Before vs After
              </p>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-900/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Before
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    <li>• Manual paper-based searches</li>
                    <li>• Fragmented, offline archives</li>
                    <li>• Difficult dispute resolution</li>
                    <li>• Fraud discovered too late</li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    After
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-emerald-50">
                    <li>• Instant, verifiable lookups</li>
                    <li>• Shared, tamper-evident ledger</li>
                    <li>• Clear audit trails for ownership</li>
                    <li>• Proactive fraud prevention</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">Mission</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Protect citizens from land fraud and double selling.</li>
                <li>
                  • Give public authorities a reliable, modern registry to
                  operate from.
                </li>
                <li>
                  • Unlock capital by making land assets easier to verify and
                  transact.
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-900/40"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <Globe2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">Vision</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• A world where every parcel has a verifiable identity.</li>
                <li>
                  • Cross-border land transactions that are compliant and
                  instant.
                </li>
                <li>
                  • Land data that outlives any single system or administration.
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Our Journey
          </h2>
          <div className="relative mt-10">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500 via-emerald-500/30 to-transparent" />
            <div className="space-y-8">
              {roadmap.map((item, index) => {
                const isEven = index % 2 === 1;
                return (
                  <motion.div
                    key={item.year}
                    initial={
                      isEven
                        ? { opacity: 0, x: 40 }
                        : { opacity: 0, x: -40 }
                    }
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5 }}
                    className="relative flex gap-4 pl-12"
                  >
                    <div className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400 bg-slate-950 text-[11px] font-semibold text-emerald-300">
                      {item.year}
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Team & Partners
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
                A multidisciplinary team spanning registry operations, public
                policy, blockchain engineering, and UX — supported by partner
                institutions.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3"
          >
            {['Registry Ops', 'Blockchain', 'Policy', 'Security', 'UX', 'Advisors'].map(
              (label) => (
                <motion.div
                  key={label}
                  whileHover={{
                    y: -4,
                    boxShadow: '0 18px 40px rgba(15, 118, 110, 0.35)',
                  }}
                  className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-emerald-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {label} Team
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Placeholder profiles — ready to be replaced with your core
                    contributors.
                  </p>
                </motion.div>
              ),
            )}
          </motion.div>
        </div>
      </section>

      {/* Technology & Security */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Powered by Modern Blockchain Technology
            </h2>
            <p className="text-sm text-slate-300 sm:text-base">
              Under the hood, PropChain combines best-in-class cryptography,
              smart contracts, and access controls.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mt-8 grid gap-6 md:grid-cols-3"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Immutable Ledger
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Append-only record of land events.</li>
                <li>• Cryptographic proofs for key state changes.</li>
                <li>• Designed to survive infrastructure failures.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Smart Contracts
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Escrow funds until conditions are met.</li>
                <li>• Automate title transfer on final signature.</li>
                <li>• Generate verifiable receipts for audits.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                End-to-End Access Control
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                <li>• Fine-grained permissions for each actor.</li>
                <li>• Encryption for sensitive off-chain documents.</li>
                <li>• Clear, reviewable consent trails.</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default About;








