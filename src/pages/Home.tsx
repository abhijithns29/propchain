import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, MapPinned, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '../components/layout/MarketingLayout';

const stats = [
  { label: 'Verified Land Parcels', value: '1,200+' },
  { label: 'Regions Onboarded', value: '5+' },
  { label: 'Immutable Records', value: '24/7' },
  { label: 'Avg. Verification Time', value: '< 60s' },
];

const features = [
  {
    title: 'Blockchain Security',
    description: 'Every land record is anchored on-chain for tamper-proof ownership.',
    icon: ShieldCheck,
  },
  {
    title: 'Instant Verification',
    description: 'Search and validate titles in seconds instead of weeks.',
    icon: Zap,
  },
  {
    title: 'Smart Contracts',
    description: 'Automate payments, escrow, and registrations with code.',
    icon: MapPinned,
  },
  {
    title: 'Full Audit Trails',
    description: 'See every transfer, lien, and dispute in a transparent history.',
    icon: TrendingUp,
  },
];

const howItWorks = [
  {
    title: 'Create Account / Login',
    description: 'Securely onboard with KYC-backed profiles for buyers, sellers, and authorities.',
  },
  {
    title: 'Add or Discover a Land Parcel',
    description: 'Tokenize new parcels or explore verified properties on the marketplace.',
  },
  {
    title: 'Verify Ownership on Blockchain',
    description: 'Run instant checks on-chain to validate current ownership and encumbrances.',
  },
  {
    title: 'Complete Smart-Contract Transaction',
    description: 'Settle payments, transfer titles, and generate immutable receipts.',
  },
];

const lands = [
  {
    title: 'Seaside Residency Plot #42',
    location: 'Coastal Region, Zone A',
    description: 'Prime coastal parcel with direct access to planned smart city amenities.',
  },
  {
    title: 'Greenfield Agro Estate',
    location: 'Agro Belt, Sector 7',
    description: 'Verified agricultural land with long-term lease potential and water access.',
  },
  {
    title: 'Metro Skyline Apartments Block',
    location: 'Central Business District',
    description: 'High-rise residential block with fractional ownership options.',
  },
];

const testimonials = [
  {
    quote:
      'We reduced title verification times from weeks to minutes. Our team now relies on PropChain for every transaction.',
    name: 'Anita Rao',
    role: 'Chief Registrar, Urban Land Authority',
  },
  {
    quote:
      'As a buyer, I could see the full ownership history before committing funds. It completely changed how I perceive risk.',
    name: 'David Mensah',
    role: 'Property Buyer',
  },
  {
    quote:
      'The on-chain audit trail is invaluable for our compliance reviews and dispute resolution workflows.',
    name: 'Farid Al Khatib',
    role: 'Lead Auditor, Public Records Office',
  },
];

const faqs = [
  {
    question: 'Is PropChain a legal land registry?',
    answer:
      'PropChain integrates with existing legal registries where applicable. It is designed to augment, not replace, your jurisdiction’s legal framework.',
  },
  {
    question: 'How are land records verified before going on-chain?',
    answer:
      'Each record goes through a verification workflow with authorities and trusted partners before it is anchored to the blockchain.',
  },
  {
    question: 'Do I need a crypto wallet to use PropChain?',
    answer:
      'Buyers and sellers can connect a compatible wallet for smart-contract settlements, but authorities can operate with standard accounts.',
  },
  {
    question: 'Which blockchains does PropChain support?',
    answer:
      'The platform is built to be chain-agnostic and can be deployed on EVM-compatible networks based on regulatory and infrastructure needs.',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <MarketingLayout>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative overflow-hidden"
      >
        <motion.div
          style={{ y: parallaxY }}
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950"
        />
        <div className="pointer-events-none absolute -right-32 -top-40 -z-10 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-40 -z-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 pb-16 pt-4 sm:px-6 lg:flex-row lg:gap-20 lg:px-8 xl:pb-24 xl:pt-6">
          {/* Left content */}
          <div className="max-w-xl space-y-6 lg:basis-1/2">
            <p className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300">
              Land Registry • Marketplace • Compliance
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Secure, Transparent Land Registry on{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                Blockchain
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Prevent land fraud, verify ownership instantly, and run
              compliant property transactions through a blockchain-powered
              registry and marketplace — all in one place.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/marketplace-preview')}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-transparent px-5 py-3 text-sm font-medium text-emerald-200 hover:bg-emerald-500/10"
              >
                Explore Marketplace
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Trusted by buyers, sellers, and public authorities for
              high-stakes land transfers.
            </p>
          </div>

          {/* Right hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="lg:basis-1/2"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mx-auto max-w-md rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-5 shadow-2xl shadow-emerald-500/25 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Live Registry
                  </p>
                  <p className="text-sm text-slate-300">
                    Immutable land ownership graph
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-200">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Synced on-chain
                </span>
              </div>
              <div className="space-y-3 rounded-2xl bg-slate-950/60 p-4 ring-1 ring-white/5">
                {lands.map((land, index) => (
                  <div
                    key={land.title}
                    className="flex items-start justify-between rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-emerald-100">
                        {land.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {land.location}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-300 line-clamp-2">
                        {land.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 pl-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Verified
                      </span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
                        Parcel #{index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats strip */}
      <section className="border-y border-slate-800/80 bg-slate-950/90">
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:px-8"
        >
          {stats.map((item) => (
            <motion.div
              key={item.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4 },
                },
              }}
              className="min-w-[140px] flex-1 space-y-1"
            >
              <p className="text-lg font-semibold text-emerald-300">
                {item.value}
              </p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Why PropChain?
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              A unified platform to secure land titles, orchestrate deals, and
              keep regulators, banks, and buyers aligned.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm shadow-slate-900/40 backdrop-blur-xl"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              How It Works
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              From onboarding to smart-contract settlement, every step is
              orchestrated with trust and transparency.
            </p>
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500 via-emerald-500/30 to-transparent" />
              <div className="space-y-8">
                {howItWorks.map((step, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <motion.div
                      key={step.title}
                      initial={
                        isEven
                          ? { opacity: 0, x: 40 }
                          : { opacity: 0, x: -40 }
                      }
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.5 }}
                      className="relative flex gap-4 pl-10"
                    >
                      <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400 bg-slate-950 text-[11px] font-semibold text-emerald-300">
                        {index + 1}
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
                        <h3 className="text-sm font-semibold text-white">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="hidden h-full w-px bg-slate-800/80 md:block" aria-hidden />
          </div>
        </div>
      </section>

      {/* Carousel */}
      <LandsCarousel onGetStarted={() => navigate('/login')} />

      {/* Testimonials */}
      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Trusted by Buyers and Authorities
            </h2>
            <p className="text-sm text-slate-400 sm:text-base">
              Built for regulators, institutions, and property participants
              who cannot compromise on security or transparency.
            </p>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((t) => (
              <motion.article
                key={t.name}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.4 },
                  },
                }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm shadow-slate-900/40"
              >
                <p className="text-xs text-slate-300 sm:text-sm">
                  “{t.quote}”
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-emerald-300">{t.role}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {/* Partner logos strip */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:px-6 sm:text-xs">
            <span>Municipal Land Offices</span>
            <span>Registry Authorities</span>
            <span>Compliance Teams</span>
            <span>Title Insurance</span>
          </div>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <div className="mt-6 space-y-3">
                {faqs.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
                      <span>{item.question}</span>
                      <span className="text-xs text-slate-400 group-open:hidden">
                        +
                      </span>
                      <span className="hidden text-xs text-slate-400 group-open:inline">
                        −
                      </span>
                    </summary>
                    <p className="mt-3 text-xs text-slate-300 sm:text-sm">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-slate-900 p-[1px]"
            >
              <div className="h-full rounded-[1.45rem] bg-slate-950/90 p-6 shadow-xl shadow-emerald-500/20">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Final Step
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                  Ready to Secure Your Land Transactions?
                </h3>
                <p className="mt-3 text-sm text-slate-300">
                  Bring your registry, marketplace, or portfolio into a
                  single source of truth — anchored by blockchain.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 text-[11px] text-slate-400">
                  No blockchain expertise required. Your teams keep using
                  workflows they know — with stronger guarantees underneath.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

interface LandsCarouselProps {
  onGetStarted: () => void;
}

const LandsCarousel: React.FC<LandsCarouselProps> = ({ onGetStarted }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isHovered) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % lands.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [isHovered]);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="bg-slate-900 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="max-w-md space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Explore Verified Lands
            </h2>
            <p className="text-sm text-slate-300 sm:text-base">
              Browse a catalog of vetted parcels with on-chain verification
              and transparent history — ready for compliant transactions.
            </p>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div
            className="relative flex-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-slate-950/80 p-4 shadow-xl shadow-emerald-500/20 backdrop-blur-xl">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
              >
                <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 md:h-64">
                  <img
                    src="/placeholder-land.svg"
                    alt={lands[activeIndex].title}
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-medium text-emerald-200">
                    Verified on Blockchain
                  </div>
                  <div className="absolute bottom-4 left-4 rounded-xl bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200">
                    On-chain proof of ownership • Immutable history
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-slate-950/80 p-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Featured Parcel
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-white">
                      {lands[activeIndex].title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lands[activeIndex].location}
                    </p>
                    <p className="mt-3 text-xs text-slate-300 sm:text-sm">
                      {lands[activeIndex].description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Land Token ID: #{activeIndex + 1843}</span>
                    <span>Last verified: &lt; 5 mins ago</span>
                  </div>
                </div>
              </motion.div>

              {/* Arrows */}
              <div className="pointer-events-none absolute inset-y-0 flex items-center justify-between px-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      (prev) => (prev - 1 + lands.length) % lands.length,
                    )
                  }
                  className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-slate-200 ring-1 ring-slate-700 hover:text-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev + 1) % lands.length)
                  }
                  className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-slate-200 ring-1 ring-slate-700 hover:text-white"
                >
                  ›
                </button>
              </div>

              {/* Dots */}
              <div className="mt-4 flex justify-center gap-2 text-[8px] text-slate-500">
                {lands.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeIndex
                        ? 'w-6 bg-emerald-400'
                        : 'w-2 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Home;








