import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import MarketingLayout from '../components/layout/MarketingLayout';

const Contact: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);

    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    if (form.message.trim().length < 10) {
      setError('Message should be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setForm({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 1200);
  };

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white via-gray-50 to-blue-50 pb-10 pt-2">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4154f1]">
              Contact Us
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#012970] sm:text-4xl">
              We're here to help
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-600 sm:text-base">
              Whether you are a land authority, marketplace operator, or
              property buyer, we can help you onboard, verify, and transact
              with confidence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Split layout */}
      <section className="bg-white pb-16 pt-2 sm:pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          {/* Left info card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-[#012970]">
                Contact Information
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Reach out to our team for support, onboarding, or partnership
                discussions.
              </p>
              <dl className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-[#4154f1]" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Support Email
                    </dt>
                    <dd className="mt-1">support@propchain.app</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-[#4154f1]" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Phone
                    </dt>
                    <dd className="mt-1">+1 (555) 012-3456</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-[#4154f1]" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Office Hours
                    </dt>
                    <dd className="mt-1">Mon–Fri, 9:00–18:00 (UTC)</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#4154f1]" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Address
                    </dt>
                    <dd className="mt-1">
                      Placeholder District, Smart City Hub, Global Region
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#012970]">
                Registry & Marketplace Deployments
              </h3>
              <p className="mt-2 text-xs text-gray-600">
                Explore how PropChain can be adapted to your local legal
                framework, registry workflows, and infrastructure
                requirements.
              </p>
              <div className="mt-4 h-32 rounded-2xl bg-white text-[11px] text-gray-500 border border-gray-200 flex items-center justify-center">
                Map placeholder — plug in your preferred map provider.
              </div>
            </div>
          </motion.div>

          {/* Right form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-[#012970]">
              Send us a message
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Share a bit about your use case and our team will follow up
              shortly.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1]"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1]"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Subject *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1]"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-[#4154f1] focus:border-[#4154f1]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              {submitted && !error && (
                <div className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Thanks, we'll get back to you soon.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4154f1] to-[#3346d8] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-[#3346d8] hover:to-[#2235c7] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending…
                  </span>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Contact;
