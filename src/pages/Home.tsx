import React, { useRef } from 'react';
import { ArrowRight, ShieldCheck, Zap, MapPinned, TrendingUp, CheckCircle2, Award, ClipboardCheck, Dribbble, Filter, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
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

const values = [
  {
    title: 'Next-Gen Blockchain',
    description: 'We value the power of blockchain technology in ensuring transparency, security, and decentralization, allowing every property transaction to be tamper-proof, verifiable, and free from unnecessary intermediaries.',
    image: '/assets/img/values-1.png',
  },
  {
    title: 'Smart Innovation',
    description: 'We are committed to continuously pushing the boundaries of real estate technology, integrating cutting-edge solutions like smart contracts and AI-driven analytics to enhance user experience and streamline the buying and selling process.',
    image: '/assets/img/values-2.png',
  },
  {
    title: 'Efficiency and Time Management',
    description: 'We prioritize making property transactions faster and more seamless by automating processes, reducing paperwork, and eliminating delays, ensuring that our users save valuable time while achieving their real estate goals effortlessly.',
    image: '/assets/img/values-3.png',
  },
];

const altFeatures = [
  {
    title: 'Trust and Transparency',
    description: 'We are committed to maintaining the highest standards of trust by ensuring transparency in all our operations and transactions.',
    icon: Award,
  },
  {
    title: 'Minimal Errors',
    description: 'We rigorously test and optimize our platform to minimize errors, providing users with a smooth and hassle-free experience.',
    icon: ClipboardCheck,
  },
  {
    title: 'Expert Team',
    description: 'Our skilled professionals bring extensive experience in blockchain, real estate, and technology, ensuring top-notch service and innovative solutions.',
    icon: Dribbble,
  },
  {
    title: 'Customer First',
    description: 'We take a professional and customer-centric approach, ensuring that every interaction is handled with care, respect, and efficiency.',
    icon: Filter,
  },
  {
    title: 'Fast Response',
    description: 'We prioritize quick and efficient communication, ensuring that all queries and concerns are addressed promptly to provide a seamless user experience.',
    icon: Zap,
  },
  {
    title: 'Verified and Secure',
    description: 'Our company is fully verified and follows strict security protocols, guaranteeing authenticity and reliability in every transaction.',
    icon: BadgeCheck,
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
      'PropChain integrates with existing legal registries where applicable. It is designed to augment, not replace, your jurisdiction legal framework.',
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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

// Reusable animated section component
const AnimatedSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold tracking-tight text-[#012970] md:text-5xl lg:text-6xl">
                Unlocking growth with PropChain smart solutions
              </h1>
              <p className="text-lg text-gray-600">
                Transforming your business growth with cutting-edge, tailored property solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 rounded bg-[#4154f1] px-8 py-3 text-base font-medium text-white transition hover:bg-[#3346d8]"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/marketplace-preview')}
                  className="inline-flex items-center justify-center gap-2 rounded border-2 border-[#4154f1] bg-transparent px-8 py-3 text-base font-medium text-[#4154f1] transition hover:bg-[#4154f1] hover:text-white"
                >
                  Explore Marketplace
                </motion.button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="order-first lg:order-last"
            >
              <motion.img
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                src="/assets/img/hero-img.png"
                alt="PropChain Hero"
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <AnimatedSection>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-[#4154f1]">Who We Are</h3>
                <h2 className="text-3xl font-bold text-[#012970] md:text-4xl">
                  At PropChain, we are revolutionizing the real estate industry by integrating blockchain technology to create a transparent, secure, and decentralized property marketplace.
                </h2>
                <p className="text-gray-600">
                  We are committed to making property transactions more efficient, cost-effective, and accessible to everyone. Join us in redefining how properties are bought and sold in the digital era.
                </p>
                <motion.button
                  whileHover={{ x: 5 }}
                  className="inline-flex items-center gap-2 text-[#4154f1] font-medium transition-all"
                >
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <motion.img
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                src="/assets/img/about.jpg"
                alt="About PropChain"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-[#012970] md:text-4xl">Our Values</h2>
              <p className="mt-2 text-gray-600">What we value most</p>
            </div>
          </AnimatedSection>
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((value, index) => (
              <AnimatedSection key={value.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <img
                    src={value.image}
                    alt={value.title}
                    className="mb-4 w-full h-auto"
                  />
                  <h3 className="mb-3 text-xl font-semibold text-[#012970]">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-[#012970] md:text-4xl">Features</h2>
              <p className="mt-2 text-gray-600">Our Advanced Features</p>
            </div>
          </AnimatedSection>
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <AnimatedSection>
              <img
                src="/assets/img/features.png"
                alt="Features"
                className="w-full h-auto"
              />
            </AnimatedSection>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-[#4154f1]" />
                    <h3 className="font-semibold text-[#012970]">{feature.title}</h3>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Alt Features Section */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="grid gap-6 md:grid-cols-2">
              {altFeatures.map((feature, index) => (
                <AnimatedSection key={feature.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#4154f1]/10 text-[#4154f1]"
                    >
                      <feature.icon className="h-6 w-6" />
                    </motion.div>
                    <h4 className="text-lg font-semibold text-[#012970]">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
            <AnimatedSection delay={0.3}>
              <div className="order-first lg:order-last">
                <img
                  src="/assets/img/alt-features.png"
                  alt="Additional Features"
                  className="w-full h-auto"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold text-[#012970] md:text-4xl">How It Works</h2>
              <p className="mt-3 text-gray-600">
                From onboarding to smart-contract settlement, every step is orchestrated with trust and transparency.
              </p>
            </div>
          </AnimatedSection>
          <div className="space-y-8">
            {howItWorks.map((step, index) => (
              <AnimatedSection key={step.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ x: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#4154f1] bg-white text-lg font-bold text-[#4154f1]"
                  >
                    {index + 1}
                  </motion.div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-[#012970]">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold text-[#012970] md:text-4xl">
                Trusted by Buyers and Authorities
              </h2>
              <p className="mt-3 text-gray-600">
                Built for regulators, institutions, and property participants who cannot compromise on security or transparency.
              </p>
            </div>
          </AnimatedSection>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, index) => (
              <AnimatedSection key={t.name} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm"
                >
                  <p className="mb-4 text-gray-700 italic">&quot;{t.quote}&quot;</p>
                  <div>
                    <p className="font-semibold text-[#012970]">{t.name}</p>
                    <p className="text-sm text-[#4154f1]">{t.role}</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4 text-xs uppercase tracking-wider text-gray-500">
              <span>Municipal Land Offices</span>
              <span>Registry Authorities</span>
              <span>Compliance Teams</span>
              <span>Title Insurance</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[2fr_1.4fr]">
            <div>
              <AnimatedSection>
                <h2 className="mb-6 text-3xl font-bold text-[#012970] md:text-4xl">
                  Frequently Asked Questions
                </h2>
              </AnimatedSection>
              <div className="space-y-4">
                {faqs.map((item, index) => (
                  <AnimatedSection key={item.question} delay={index * 0.1}>
                    <motion.details
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                      className="group rounded-lg border border-gray-200 bg-white p-5"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-[#012970]">
                        <span>{item.question}</span>
                        <span className="text-gray-400 group-open:hidden">+</span>
                        <span className="hidden text-gray-400 group-open:inline">−</span>
                      </summary>
                      <p className="mt-3 text-gray-600">{item.answer}</p>
                    </motion.details>
                  </AnimatedSection>
                ))}
              </div>
            </div>
            <AnimatedSection delay={0.3}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl bg-gradient-to-br from-[#4154f1]/10 to-white p-8 shadow-lg"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4154f1]">
                  Final Step
                </p>
                <h3 className="mt-3 text-2xl font-bold text-[#012970] md:text-3xl">
                  Ready to Secure Your Land Transactions?
                </h3>
                <p className="mt-3 text-gray-600">
                  Bring your registry, marketplace, or portfolio into a single source of truth — anchored by blockchain.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="mt-6 inline-flex items-center gap-2 rounded bg-[#4154f1] px-8 py-3 text-base font-medium text-white transition hover:bg-[#3346d8]"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <p className="mt-3 text-xs text-gray-500">
                  No blockchain expertise required. Your teams keep using workflows they know — with stronger guarantees underneath.
                </p>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Home;
