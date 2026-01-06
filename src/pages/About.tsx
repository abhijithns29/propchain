import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Layers, Globe2, Users, Target, Zap, Award, TrendingUp, Lock } from 'lucide-react';
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
      {/* Hero - Simple white background like homepage */}
      <section className="bg-white pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
            <Award className="h-4 w-4 text-[#4154f1]" />
            <span className="text-sm font-semibold text-[#4154f1]">About PropChain</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#012970] mb-6">
            Solving Land Fraud with<br />
            <span className="text-[#4154f1]">Verifiable, Shared Truth</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 leading-relaxed">
            PropChain exists to bridge the gap between traditional land
            registries and modern digital markets, creating a single,
            trustworthy source of property truth.
          </p>
        </motion.div>
      </section>

      {/* Story Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <span className="inline-block text-sm font-semibold text-[#4154f1] uppercase tracking-wider mb-3">Our Story</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#012970]">
                  The Story Behind PropChain
                </h2>
              </div>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  In many regions, land registries are fragmented across paper
                  archives, disconnected systems, and siloed databases. This makes
                  it difficult to establish who truly owns what — and opens the
                  door to fraud, disputes, and stalled economic activity.
                </p>
                <p>
                  PropChain was born out of collaboration between technologists,
                  policy experts, and registry officials who wanted a more
                  verifiable, resilient way to store and share land ownership
                  data.
                </p>
                <p className="font-medium text-[#012970]">
                  By anchoring records on blockchain and designing workflows
                  around existing legal frameworks, PropChain turns land data
                  from an opaque liability into a transparent asset.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="/assets/img/about.jpg"
                  alt="About PropChain"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, value: '100%', label: 'Secure & Transparent' },
              { icon: TrendingUp, value: '24/7', label: 'Always Available' },
              { icon: Lock, value: '0', label: 'Fraud Cases' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100"
              >
                <div className="w-14 h-14 mx-auto bg-[#4154f1] rounded-xl flex items-center justify-center mb-4">
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <p className="text-3xl font-bold text-[#012970] mb-2">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-[#4154f1] uppercase tracking-wider mb-3">Transformation</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#012970]">Before vs After PropChain</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Before</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Manual paper-based searches',
                  'Fragmented, offline archives',
                  'Difficult dispute resolution',
                  'Fraud discovered too late',
                  'Weeks to verify ownership',
                  'High transaction costs'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#4154f1] rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-white">✓</span>
                </div>
                <h3 className="text-xl font-bold text-[#012970]">After</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Instant, verifiable lookups',
                  'Shared, tamper-evident ledger',
                  'Clear audit trails for ownership',
                  'Proactive fraud prevention',
                  'Real-time verification',
                  'Reduced transaction costs'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#012970] font-medium">
                    <span className="text-[#4154f1] mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
            >
              <div className="w-14 h-14 bg-[#4154f1] rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#012970] mb-4">Our Mission</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#4154f1] mt-0.5 flex-shrink-0" />
                  <span>Protect citizens from land fraud and double selling</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#4154f1] mt-0.5 flex-shrink-0" />
                  <span>Give public authorities a reliable, modern registry to operate from</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#4154f1] mt-0.5 flex-shrink-0" />
                  <span>Unlock capital by making land assets easier to verify and transact</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
            >
              <div className="w-14 h-14 bg-[#4154f1] rounded-xl flex items-center justify-center mb-6">
                <Globe2 className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#012970] mb-4">Our Vision</h2>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#4154f1] mt-0.5 flex-shrink-0" />
                  <span>A world where every parcel has a verifiable identity</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#4154f1] mt-0.5 flex-shrink-0" />
                  <span>Cross-border land transactions that are compliant and instant</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-[#4154f1] mt-0.5 flex-shrink-0" />
                  <span>Land data that outlives any single system or administration</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-[#4154f1] uppercase tracking-wider mb-3">Roadmap</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#012970]">Our Journey</h2>
          </div>

          <div className="relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-300" />

            <div className="space-y-12">
              {roadmap.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5 }}
                    className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className="absolute left-8 md:left-1/2 w-4 h-4 -ml-2 bg-[#4154f1] rounded-full border-4 border-white shadow-md z-10" />

                    <div className={`w-full md:w-5/12 ${isEven ? 'md:pr-12' : 'md:pl-12'} pl-20 md:pl-0`}>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-[#4154f1] text-white text-xs font-bold rounded-full">
                            {item.year}
                          </span>
                          <h3 className="text-lg font-bold text-[#012970]">{item.title}</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-[#4154f1] uppercase tracking-wider mb-3">Our Team</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#012970] mb-4">
              Team & Partners
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              A multidisciplinary team spanning registry operations, public
              policy, blockchain engineering, and UX — supported by partner
              institutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {['Registry Ops', 'Blockchain', 'Policy', 'Security', 'UX', 'Advisors'].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto bg-[#4154f1] rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#012970] mb-2">{label} Team</h3>
                <p className="text-sm text-gray-600">
                  Expert professionals driving innovation
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-[#4154f1] uppercase tracking-wider mb-3">Technology</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#012970] mb-4">
              Powered by Modern Blockchain
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              Under the hood, PropChain combines best-in-class cryptography,
              smart contracts, and access controls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: 'Immutable Ledger',
                points: [
                  'Append-only record of land events',
                  'Cryptographic proofs for key state changes',
                  'Designed to survive infrastructure failures'
                ]
              },
              {
                icon: ShieldCheck,
                title: 'Smart Contracts',
                points: [
                  'Escrow funds until conditions are met',
                  'Automate title transfer on final signature',
                  'Generate verifiable receipts for audits'
                ]
              },
              {
                icon: Users,
                title: 'Access Control',
                points: [
                  'Fine-grained permissions for each actor',
                  'Encryption for sensitive off-chain documents',
                  'Clear, reviewable consent trails'
                ]
              }
            ].map((tech, i) => (
              <motion.div
                key={tech.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#4154f1] rounded-xl flex items-center justify-center mb-4">
                  <tech.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#012970] mb-4">{tech.title}</h3>
                <ul className="space-y-2">
                  {tech.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600 text-sm">
                      <span className="text-[#4154f1] mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default About;
