import { useState } from "react";
import {
  Store, Sparkles, ShoppingBag, Truck, Shield, Zap, ChevronRight,
  Star, CheckCircle, ArrowRight, Menu, X, TrendingUp, Users, Package,
  CreditCard, MessageSquare, BarChart3, Lock, RefreshCw, Globe,
  Smartphone, Headphones, Banknote, ChevronDown, ChevronUp,
  BadgeCheck, Clock, Layers, Search, Bot
} from "lucide-react";

// ─── Nav ────────────────────────────────────────────────────
function Nav({ onEnter }: { onEnter: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled] = useState(false);

  const links = ["Features", "How it works", "For Merchants", "Pricing", "FAQ"];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 mr-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Store size={16} className="text-white" />
          </div>
          <span className="font-[var(--font-display)] text-white font-semibold text-xl tracking-tight">Markto</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-agent)]/40 text-violet-300 font-semibold uppercase tracking-wide">AI</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <button onClick={onEnter} className="text-sm text-white/70 hover:text-white px-3 py-1.5 transition-colors">Sign in</button>
          <button onClick={onEnter} className="text-sm font-semibold bg-[var(--color-accent)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors">
            Get started free
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button className="lg:hidden ml-auto text-white/70 hover:text-white p-1" onClick={() => setOpen(o => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[var(--color-sidebar)] border-t border-[var(--color-sidebar-border)] px-5 py-4 flex flex-col gap-2">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-white/70 hover:text-white transition-colors">
              {l}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[var(--color-sidebar-border)]">
            <button onClick={onEnter} className="py-2.5 text-sm text-white/70 hover:text-white transition-colors text-left">Sign in</button>
            <button onClick={onEnter} className="py-2.5 text-sm font-semibold bg-[var(--color-accent)] text-white px-4 rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors">
              Get started free
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────
function Hero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative bg-[var(--color-sidebar)] overflow-hidden min-h-screen flex items-center">
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[var(--color-primary)]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[var(--color-agent)]/15 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 text-blue-300 text-xs font-semibold mb-6">
              <Bot size={12} />
              Nigeria's first AI-native marketplace
            </div>
            <h1 className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Buy and sell<br />
              <span className="italic font-light text-[var(--color-accent)]">smarter,</span><br />
              not harder.
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-lg mb-8">
              Markto combines a full-featured marketplace with an AI shopping assistant. Just tell it what you want — it finds, compares, and buys for you. Merchants get powerful tools, instant payouts, and real insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button onClick={onEnter} className="flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[var(--color-accent-hover)] transition-colors text-sm">
                Start shopping free <ArrowRight size={16} />
              </button>
              <button onClick={onEnter} className="flex items-center justify-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/15 transition-colors text-sm border border-white/10">
                <Store size={15} /> Open your store
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {["1687422808384-c896d0efd4ab","1687422808311-a776f467a468","1687422808565-929533931584","605902711622-cfb43c4437b5"].map((id, i) => (
                  <img key={i} src={`https://images.unsplash.com/photo-${id}?w=48&h=48&fit=crop&auto=format`}
                    className="w-9 h-9 rounded-full border-2 border-[var(--color-sidebar)] object-cover" alt="User" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />)}
                </div>
                <p className="text-white/50 text-xs">Trusted by <span className="text-white font-semibold">50,000+</span> buyers & merchants</p>
              </div>
            </div>
          </div>

          {/* Right – App preview card */}
          <div className="relative hidden lg:block">
            <div className="relative bg-[var(--color-sidebar-surface)] rounded-2xl border border-[var(--color-sidebar-border)] shadow-2xl overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-sidebar-border)]">
                <div className="w-7 h-7 rounded-full bg-[var(--color-agent)] flex items-center justify-center">
                  <Sparkles size={13} className="text-white" />
                </div>
                <span className="text-white text-sm font-medium">Markto AI</span>
                <div className="ml-auto flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <span className="text-[10px] text-white/40">Online</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[var(--color-primary)] text-white text-sm px-3 py-2 rounded-xl rounded-tr-sm max-w-[70%]">
                    Show me phones under ₦300k
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-agent)] flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <div className="bg-white/10 text-white/80 text-xs px-3 py-2 rounded-xl rounded-tl-sm max-w-[80%]">
                    Found 8 smartphones under ₦300,000 ↓
                  </div>
                </div>

                {/* Mini product cards */}
                <div className="grid grid-cols-2 gap-2 ml-8">
                  {[
                    { name: "Tecno Camon 30", price: "₦185,000", img: "1610945415295-d9bbf067e59c" },
                    { name: "Samsung A55", price: "₦298,000", img: "1512941937669-90a1b58e7e9c" },
                  ].map(p => (
                    <div key={p.name} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                      <img src={`https://images.unsplash.com/photo-${p.img}?w=200&h=120&fit=crop&auto=format`}
                        className="w-full h-16 object-cover" alt={p.name} />
                      <div className="p-2">
                        <p className="text-white text-[10px] font-medium leading-tight">{p.name}</p>
                        <p className="text-[var(--color-accent)] text-[10px] font-bold mt-0.5">{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-agent)] flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <div className="bg-white/10 text-white/80 text-xs px-3 py-2 rounded-xl rounded-tl-sm">
                    Want me to add the Samsung A55 to your cart?
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-[var(--color-primary)] text-white text-sm px-3 py-2 rounded-xl rounded-tr-sm">
                    Yes, add it 🛒
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="px-4 pb-4">
                <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-white/20 text-xs flex-1">Ask me anything…</span>
                  <div className="w-6 h-6 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                    <ArrowRight size={11} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-[var(--color-success)] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-1.5">
              <CheckCircle size={12} /> Order confirmed!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white text-[var(--color-foreground)] px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border border-[var(--color-border)]">
              <p className="text-[var(--color-muted)] text-[10px]">Payout received</p>
              <p className="font-[var(--font-mono)] font-bold text-[var(--color-success-fg)] text-sm">+₦2,840,000</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "50K+", label: "Active users", icon: <Users size={16} /> },
            { value: "8,200+", label: "Verified merchants", icon: <Store size={16} /> },
            { value: "₦4.1B+", label: "Processed monthly", icon: <Banknote size={16} /> },
            { value: "99.8%", label: "Uptime SLA", icon: <Globe size={16} /> },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 text-white/40 mb-2">{s.icon}<span className="text-xs">{s.label}</span></div>
              <div className="font-[var(--font-display)] text-3xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Logos / trusted by ─────────────────────────────────────
function TrustedBy() {
  const partners = ["GTBank", "Paystack", "Flutterwave", "DHL Nigeria", "GIG Logistics", "Interswitch"];
  return (
    <section className="bg-[var(--color-surface-2)] border-y border-[var(--color-border)] py-6">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <p className="text-xs text-center text-[var(--color-muted)] uppercase tracking-widest font-semibold mb-5">Trusted partners & integrations</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
          {partners.map(p => (
            <span key={p} className="text-sm font-semibold text-[var(--color-muted)] opacity-60 hover:opacity-100 transition-opacity">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: <Bot size={22} className="text-[var(--color-agent)]" />,
      title: "AI Shopping Assistant",
      desc: "Tell Markto AI what you want in plain language. It searches, filters, compares prices, and buys on your behalf — no scrolling required.",
      badge: "New",
      badgeColor: "bg-violet-100 text-violet-700",
    },
    {
      icon: <Shield size={22} className="text-[var(--color-success-fg)]" />,
      title: "Buyer Protection",
      desc: "Every purchase is covered by our escrow system. Funds are only released to merchants after you confirm delivery. Full refund if something goes wrong.",
    },
    {
      icon: <Zap size={22} className="text-[var(--color-accent)]" />,
      title: "Instant Merchant Payouts",
      desc: "Merchants get paid fast. Funds clear to your linked bank account within 24 hours of confirmed delivery, every time.",
    },
    {
      icon: <BarChart3 size={22} className="text-[var(--color-primary)]" />,
      title: "Merchant Analytics",
      desc: "Real-time dashboards showing sales trends, top-performing SKUs, customer lifetime value, and payout forecasts. Know your numbers.",
    },
    {
      icon: <Truck size={22} className="text-orange-500" />,
      title: "Integrated Logistics",
      desc: "Connect with GIG Logistics, DHL, and 8 other courier partners directly from your merchant dashboard. Auto-generate waybills, track every package.",
    },
    {
      icon: <Lock size={22} className="text-[var(--color-danger-fg)]" />,
      title: "Bank-grade Security",
      desc: "256-bit TLS encryption, PCI-DSS compliant payments via Paystack, 2FA on all accounts, and AI-powered fraud detection on every transaction.",
    },
    {
      icon: <Smartphone size={22} className="text-teal-600" />,
      title: "Works on Any Device",
      desc: "Fully responsive web app. No app download required. Everything from browsing to merchant dashboard runs beautifully on mobile.",
    },
    {
      icon: <Layers size={22} className="text-[var(--color-muted)]" />,
      title: "Classic View Fallback",
      desc: "Prefer traditional navigation over AI chat? Switch to Classic View anytime — a full route-driven experience that talks directly to the backend.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3 block">Everything you need</span>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-foreground)] mb-4">
            Built for buyers.<br />Optimised for merchants.
          </h2>
          <p className="text-[var(--color-muted)] text-lg max-w-xl mx-auto">
            One platform that handles the full commerce loop — discovery, checkout, fulfillment, and payout.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:shadow-[var(--shadow-md)] transition-shadow group">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-[var(--color-foreground)] text-sm">{f.title}</h3>
                {f.badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${f.badgeColor}`}>{f.badge}</span>}
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ───────────────────────────────────────────
function HowItWorks() {
  const [tab, setTab] = useState<"buyer" | "merchant">("buyer");

  const buyerSteps = [
    { n: "01", title: "Create your account", desc: "Sign up in under 60 seconds with your email or phone number. No card required to browse.", icon: <Users size={18} /> },
    { n: "02", title: "Chat with the AI assistant", desc: "Tell Markto what you're looking for. \"I need a laptop under ₦400k for video editing\" — it handles the rest.", icon: <MessageSquare size={18} /> },
    { n: "03", title: "Review and confirm", desc: "The AI shows you curated options. You review, choose, and confirm. Every financial action requires your explicit approval.", icon: <CheckCircle size={18} /> },
    { n: "04", title: "Track delivery, stay covered", desc: "Get real-time tracking updates and full buyer protection until you confirm the item arrived as described.", icon: <Truck size={18} /> },
  ];

  const merchantSteps = [
    { n: "01", title: "Open your store", desc: "Create your merchant account, verify your identity with BVN or NIN, and set up your payout bank account.", icon: <Store size={18} /> },
    { n: "02", title: "List your products", desc: "Add products with images, variants, and pricing. Bulk CSV upload available for large catalogues. AI helps with descriptions.", icon: <Package size={18} /> },
    { n: "03", title: "Receive and fulfil orders", desc: "Get notified instantly for new orders. Book a courier directly from the dashboard, or use your own logistics.", icon: <Truck size={18} /> },
    { n: "04", title: "Get paid, grow faster", desc: "Funds land in your bank account within 24 hours of delivery confirmation. Use analytics to double down on what sells.", icon: <Banknote size={18} /> },
  ];

  const steps = tab === "buyer" ? buyerSteps : merchantSteps;

  return (
    <section id="how-it-works" className="py-24 bg-[var(--color-sidebar)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3 block">Simple process</span>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-white mb-4">
            How Markto works
          </h2>

          <div className="inline-flex bg-white/10 rounded-xl p-1 gap-1 mt-2">
            {(["buyer", "merchant"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-[var(--color-accent)] text-white" : "text-white/50 hover:text-white/80"}`}>
                {t === "buyer" ? "I'm a buyer" : "I'm a merchant"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%_-_1rem)] w-8 h-px bg-white/20 z-10" />
              )}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 h-full hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/30 flex items-center justify-center text-white/70">
                    {s.icon}
                  </div>
                  <span className="font-[var(--font-mono)] text-white/20 font-bold text-xl">{s.n}</span>
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{s.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── For Buyers ─────────────────────────────────────────────
function ForBuyers({ onEnter }: { onEnter: () => void }) {
  const perks = [
    "AI finds and compares products instantly",
    "Escrow-backed buyer protection on every order",
    "Real-time delivery tracking via integrated couriers",
    "No hidden fees — what you see is what you pay",
    "Easy returns within 7 days of delivery",
    "NGN payments via card, bank transfer, or USSD",
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=800&h=600&fit=crop&auto=format"
                alt="Shopper using Markto on mobile"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Overlay card */}
            <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--color-border)] p-4 max-w-[200px]">
              <p className="text-[10px] text-[var(--color-muted)] mb-1">AI found for you</p>
              <p className="text-xs font-semibold text-[var(--color-foreground)] mb-1.5">Samsung Galaxy A55 — best match</p>
              <div className="flex items-center justify-between">
                <span className="font-[var(--font-mono)] font-bold text-[var(--color-primary)] text-sm">₦298,000</span>
                <span className="text-[10px] text-[var(--color-success-fg)] font-semibold bg-[var(--color-success-bg)] px-2 py-0.5 rounded-full">In stock</span>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3 block">For buyers</span>
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-foreground)] mb-4">
              Shopping that actually<br />
              <span className="italic text-[var(--color-primary)]">works for you.</span>
            </h2>
            <p className="text-[var(--color-muted)] text-base leading-relaxed mb-8">
              Stop wasting hours scrolling. Tell the Markto AI exactly what you need — budget, specs, brand preferences — and it surfaces the best matches from thousands of verified merchants. Add to cart, confirm, done.
            </p>

            <ul className="space-y-3 mb-8">
              {perks.map(p => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-[var(--color-foreground)]">
                  <CheckCircle size={16} className="text-[var(--color-success-fg)] shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>

            <button onClick={onEnter} className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--color-primary-hover)] transition-colors text-sm">
              Start browsing <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── For Merchants ──────────────────────────────────────────
function ForMerchants({ onEnter }: { onEnter: () => void }) {
  const perks = [
    "Free store setup — no monthly subscription fee",
    "2.5% platform fee per successful transaction only",
    "Payouts to GTBank, Access, Zenith, and 20+ banks",
    "Bulk product import via CSV or API",
    "Built-in inventory management with low-stock alerts",
    "Customer messaging and order management tools",
  ];

  return (
    <section id="for-merchants" className="py-24 bg-[var(--color-surface-2)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">For merchants</span>
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-foreground)] mb-4">
              Your store, your rules.<br />
              <span className="italic text-[var(--color-accent)]">We handle the rest.</span>
            </h2>
            <p className="text-[var(--color-muted)] text-base leading-relaxed mb-8">
              Markto gives you a professional storefront, powerful merchant tools, and access to 50,000+ active buyers from day one. No technical knowledge required — if you can describe your product, you can sell it.
            </p>

            <ul className="space-y-3 mb-8">
              {perks.map(p => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-[var(--color-foreground)]">
                  <CheckCircle size={16} className="text-[var(--color-success-fg)] shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>

            <button onClick={onEnter} className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[var(--color-accent-hover)] transition-colors text-sm">
              Open your store <ArrowRight size={15} />
            </button>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100">
              <img
                src="https://images.unsplash.com/photo-1687422808384-c896d0efd4ab?w=800&h=600&fit=crop&auto=format"
                alt="Merchant using Markto"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Overlay stat */}
            <div className="absolute -top-5 -left-5 bg-[var(--color-sidebar)] text-white rounded-2xl shadow-[var(--shadow-lg)] p-4 max-w-[180px]">
              <p className="text-[10px] text-white/50 mb-0.5">This month</p>
              <p className="font-[var(--font-mono)] font-bold text-[var(--color-accent)] text-xl">₦4.2M</p>
              <p className="text-[10px] text-white/50">in sales</p>
              <div className="mt-2 flex items-center gap-1 text-[var(--color-success-fg)] text-[10px] font-semibold">
                <TrendingUp size={10} /> +34% vs last month
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Categories ─────────────────────────────────────────────
function Categories({ onEnter }: { onEnter: () => void }) {
  const cats = [
    { name: "Smartphones", count: "3,200+ listings", emoji: "📱", color: "bg-blue-50 border-blue-100" },
    { name: "Laptops & Computers", count: "1,800+ listings", emoji: "💻", color: "bg-indigo-50 border-indigo-100" },
    { name: "Fashion & Apparel", count: "12,500+ listings", emoji: "👗", color: "bg-pink-50 border-pink-100" },
    { name: "Home & Kitchen", count: "5,700+ listings", emoji: "🏠", color: "bg-yellow-50 border-yellow-100" },
    { name: "Shoes & Footwear", count: "4,100+ listings", emoji: "👟", color: "bg-orange-50 border-orange-100" },
    { name: "Books & Education", count: "2,900+ listings", emoji: "📚", color: "bg-green-50 border-green-100" },
    { name: "Beauty & Personal Care", count: "6,300+ listings", emoji: "💄", color: "bg-rose-50 border-rose-100" },
    { name: "Sports & Outdoors", count: "1,600+ listings", emoji: "⚽", color: "bg-teal-50 border-teal-100" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2 block">Browse by category</span>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--color-foreground)]">
              Find anything you need
            </h2>
          </div>
          <button onClick={onEnter} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline">
            See all categories <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cats.map(c => (
            <button key={c.name} onClick={onEnter}
              className={`${c.color} border rounded-2xl p-4 text-left hover:shadow-md transition-shadow group`}>
              <div className="text-3xl mb-3">{c.emoji}</div>
              <h3 className="font-semibold text-[var(--color-foreground)] text-sm leading-tight mb-1">{c.name}</h3>
              <p className="text-xs text-[var(--color-muted)]">{c.count}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing / Fees ─────────────────────────────────────────
function Pricing({ onEnter }: { onEnter: () => void }) {
  return (
    <section id="pricing" className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3 block">Transparent pricing</span>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-foreground)] mb-4">
            Simple, honest fees
          </h2>
          <p className="text-[var(--color-muted)] text-lg max-w-lg mx-auto">
            No monthly subscription. No listing fees. No surprises. You only pay when you make a sale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              plan: "Buyer",
              price: "Free",
              sub: "Always",
              desc: "Browse, buy, and track orders at no cost whatsoever.",
              features: ["Unlimited browsing & searches", "AI shopping assistant", "Buyer protection on all orders", "Real-time order tracking", "Easy returns & refunds"],
              cta: "Start shopping",
              highlight: false,
            },
            {
              plan: "Merchant",
              price: "2.5%",
              sub: "per successful sale",
              desc: "One simple fee covers everything. No listing charges, no monthly costs.",
              features: ["Unlimited product listings", "All logistics integrations", "Analytics & reporting dashboard", "24-hr payout to your bank", "Dedicated merchant support"],
              cta: "Open your store",
              highlight: true,
            },
            {
              plan: "Merchant Pro",
              price: "1.5%",
              sub: "per sale · from ₦50M GMV/mo",
              desc: "For high-volume merchants who need lower rates and premium tools.",
              features: ["Everything in Merchant", "Reduced 1.5% transaction fee", "Priority customer support", "Custom store branding & domain", "API access & webhooks"],
              cta: "Contact sales",
              highlight: false,
            },
          ].map(p => (
            <div key={p.plan} className={`rounded-2xl border p-7 flex flex-col ${p.highlight ? "bg-[var(--color-sidebar)] border-[var(--color-primary)] shadow-[var(--shadow-lg)] relative overflow-hidden" : "bg-white border-[var(--color-border)]"}`}>
              {p.highlight && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-agent)]" />
              )}
              {p.highlight && (
                <span className="self-start mb-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--color-primary)]/30 text-blue-300">Most popular</span>
              )}
              <h3 className={`font-semibold text-sm mb-1 ${p.highlight ? "text-white/60" : "text-[var(--color-muted)]"}`}>{p.plan}</h3>
              <div className={`font-[var(--font-display)] text-5xl font-bold mb-1 ${p.highlight ? "text-white" : "text-[var(--color-foreground)]"}`}>{p.price}</div>
              <p className={`text-xs mb-3 ${p.highlight ? "text-white/40" : "text-[var(--color-muted)]"}`}>{p.sub}</p>
              <p className={`text-sm mb-6 leading-relaxed ${p.highlight ? "text-white/60" : "text-[var(--color-muted)]"}`}>{p.desc}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${p.highlight ? "text-white/80" : "text-[var(--color-foreground)]"}`}>
                    <CheckCircle size={14} className={`shrink-0 mt-0.5 ${p.highlight ? "text-[var(--color-success)]" : "text-[var(--color-success-fg)]"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={onEnter}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${p.highlight ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]" : "bg-[var(--color-surface-2)] text-[var(--color-foreground)] hover:bg-gray-200 border border-[var(--color-border)]"}`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Fee comparison table */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-gray-50">
            <h3 className="font-semibold text-sm text-[var(--color-foreground)]">How Markto compares</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left px-6 py-3 text-[var(--color-muted)] font-semibold text-xs">Platform</th>
                  <th className="text-center px-4 py-3 text-[var(--color-muted)] font-semibold text-xs">Listing fee</th>
                  <th className="text-center px-4 py-3 text-[var(--color-muted)] font-semibold text-xs">Transaction fee</th>
                  <th className="text-center px-4 py-3 text-[var(--color-muted)] font-semibold text-xs">Payout speed</th>
                  <th className="text-center px-4 py-3 text-[var(--color-muted)] font-semibold text-xs">AI assistant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[
                  { name: "Markto", listing: "Free", txn: "2.5%", payout: "24 hours", ai: true, highlight: true },
                  { name: "Jiji", listing: "Free / Paid", txn: "N/A (ads)", payout: "N/A", ai: false, highlight: false },
                  { name: "Konga", listing: "Free", txn: "5–10%", payout: "7–14 days", ai: false, highlight: false },
                  { name: "Jumia", listing: "Free", txn: "8–15%", payout: "7–14 days", ai: false, highlight: false },
                ].map(r => (
                  <tr key={r.name} className={r.highlight ? "bg-blue-50/50" : ""}>
                    <td className="px-6 py-3.5 font-semibold text-[var(--color-foreground)]">
                      {r.name} {r.highlight && <span className="text-[10px] text-[var(--color-primary)] font-bold">← you are here</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[var(--color-muted)]">{r.listing}</td>
                    <td className={`px-4 py-3.5 text-center font-semibold ${r.highlight ? "text-[var(--color-success-fg)]" : "text-[var(--color-muted)]"}`}>{r.txn}</td>
                    <td className={`px-4 py-3.5 text-center font-semibold ${r.highlight ? "text-[var(--color-success-fg)]" : "text-[var(--color-muted)]"}`}>{r.payout}</td>
                    <td className="px-4 py-3.5 text-center">
                      {r.ai ? <CheckCircle size={14} className="text-[var(--color-success-fg)] mx-auto" /> : <X size={14} className="text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      name: "Chidinma O.",
      role: "Fashion merchant, Lagos",
      avatar: "https://images.unsplash.com/photo-1687422808311-a776f467a468?w=64&h=64&fit=crop&auto=format",
      stars: 5,
      quote: "I moved from Jumia to Markto six months ago. My fees dropped from 12% to 2.5% and I get paid the next day. I don't know why I waited so long.",
    },
    {
      name: "Emeka A.",
      role: "Electronics buyer, Abuja",
      avatar: "https://images.unsplash.com/photo-1687422808565-929533931584?w=64&h=64&fit=crop&auto=format",
      stars: 5,
      quote: "The AI assistant is unreal. I told it I wanted a gaming laptop under ₦500k and it showed me 4 options with a comparison table. Bought one in 3 minutes.",
    },
    {
      name: "Adaeze M.",
      role: "Beauty products merchant, PH",
      avatar: "https://images.unsplash.com/photo-1687422808384-c896d0efd4ab?w=64&h=64&fit=crop&auto=format",
      stars: 5,
      quote: "The merchant dashboard is clean and the analytics actually help me understand what's selling. My store revenue doubled in 3 months.",
    },
    {
      name: "Tunde B.",
      role: "Buyer, Ibadan",
      avatar: "https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=64&h=64&fit=crop&auto=format",
      stars: 4,
      quote: "Buyer protection gives me peace of mind. I had one issue with a seller and the support team sorted it in 2 days. Full refund no stress.",
    },
    {
      name: "Ngozi K.",
      role: "Shoe merchant, Enugu",
      avatar: "https://images.unsplash.com/photo-1687422808384-c896d0efd4ab?w=64&h=64&fit=crop&auto=format",
      stars: 5,
      quote: "Listing products took less than 10 minutes. The bulk CSV import saved me hours. And the courier integration means I never have to call GIG manually again.",
    },
    {
      name: "Olumide F.",
      role: "Phone accessories buyer, Lagos",
      avatar: "https://images.unsplash.com/photo-1687422808565-929533931584?w=64&h=64&fit=crop&auto=format",
      stars: 5,
      quote: "The classic view is there if you want it, but honestly once you use the AI you won't go back. It's like having a personal shopper 24/7.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3 block">What people say</span>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-foreground)] mb-4">
            Loved by buyers and merchants
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-muted)]">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />)}</div>
            <span className="font-semibold text-[var(--color-foreground)]">4.9</span> average · 2,400+ reviews
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map(r => (
            <div key={r.name} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} className={i <= r.stars ? "fill-[var(--color-accent)] text-[var(--color-accent)]" : "text-gray-200 fill-gray-200"} />
                ))}
              </div>
              <p className="text-sm text-[var(--color-foreground)] leading-relaxed mb-4 italic">"{r.quote}"</p>
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt={r.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{r.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{r.role}</p>
                </div>
                <BadgeCheck size={16} className="ml-auto text-[var(--color-primary)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust / Security ────────────────────────────────────────
function TrustSection() {
  const items = [
    { icon: <Lock size={20} />, title: "256-bit TLS encryption", desc: "All data in transit is encrypted. Your payment details never touch our servers." },
    { icon: <Shield size={20} />, title: "Escrow protection", desc: "Buyer funds are held in escrow until you confirm receipt. Merchants can't receive funds before delivery." },
    { icon: <CreditCard size={20} />, title: "PCI-DSS compliant", desc: "Card payments processed by Paystack — a globally PCI-DSS certified payment processor." },
    { icon: <RefreshCw size={20} />, title: "Easy dispute resolution", desc: "Raise a dispute within 7 days of delivery. Our team resolves 95% of cases within 48 hours." },
    { icon: <BadgeCheck size={20} />, title: "Verified merchants", desc: "Every merchant is verified with BVN or NIN before listing. Listings are reviewed before going live." },
    { icon: <Clock size={20} />, title: "24/7 support", desc: "Reach us any time via in-app chat, email, or phone. Average first-response under 2 hours." },
  ];

  return (
    <section className="py-24 bg-[var(--color-sidebar)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3 block">Safe & secure</span>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-white mb-4">
            Your money is protected
          </h2>
          <p className="text-white/50 text-lg max-w-lg mx-auto">
            We built Markto with security as a foundation, not an afterthought.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center text-blue-300 mb-4">
                {item.icon}
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{item.title}</h3>
              <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    { q: "How does the AI shopping assistant work?", a: "The AI assistant uses natural language to understand your request, then queries our product catalogue in real time. It surfaces the best matches, explains trade-offs, and can add items to your cart — but every purchase requires your explicit confirmation. We use Claude (Anthropic) under the hood." },
    { q: "Is Markto safe? What if something goes wrong with my order?", a: "Yes. Your payment is held in escrow until you confirm the item arrived as described. If there's a problem, raise a dispute within 7 days and our team will mediate. If the merchant is at fault, you get a full refund. We've processed over ₦4 billion with a dispute resolution rate of 99.1%." },
    { q: "How quickly do merchants get paid?", a: "Merchant funds clear to your linked bank account within 24 hours of the buyer confirming delivery. On average, that's 2–5 days from order placement. For high-trust merchants (6+ months, low dispute rate), we offer same-day payouts." },
    { q: "What does it cost to list products as a merchant?", a: "Nothing upfront. Listing is free. No monthly subscription. No per-listing fee. We take a single 2.5% fee on each completed transaction. High-volume merchants (₦50M+ GMV/month) qualify for our 1.5% Pro rate." },
    { q: "Can I use Markto without the AI? I prefer traditional navigation.", a: "Absolutely. Switch to \"Classic View\" anytime from the sidebar. Classic View is a fully traditional route-driven interface that talks directly to our backend API — no AI involved. All the same products, same checkout, same merchant tools, just a conventional UX." },
    { q: "Which couriers does Markto integrate with?", a: "We integrate with GIG Logistics, DHL Nigeria, Red Star Express, Sendbox, Kwik Delivery, and 5 others. Merchants can auto-generate waybills, compare courier rates, and track every package from the merchant dashboard." },
    { q: "How does Markto verify merchants?", a: "Every merchant must complete identity verification using BVN or NIN before their first listing goes live. Product listings are reviewed within 12 hours of submission. We also monitor ongoing activity for policy violations and unusual patterns." },
    { q: "What payment methods are accepted?", a: "We accept debit/credit cards (Visa, Mastercard, Verve), bank transfers, USSD, and bank USSD codes (*822#). All payments are processed by Paystack. We do not store card details." },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3 block">Common questions</span>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-foreground)]">
            Frequently asked
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${open === i ? "border-[var(--color-primary)]/30 bg-blue-50/40" : "border-[var(--color-border)] bg-white"}`}>
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className={`font-semibold text-sm ${open === i ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>{f.q}</span>
                {open === i ? <ChevronUp size={16} className="text-[var(--color-primary)] shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-muted)] shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ──────────────────────────────────────────────
function CTABanner({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="py-24 bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="relative bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-sidebar)] rounded-3xl overflow-hidden px-10 py-16 text-center">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-agent)]/30 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold mb-5">
              <Sparkles size={11} /> Join 50,000+ users on Markto
            </div>
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-white mb-4">
              Ready to buy or sell smarter?
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
              Create your account in under a minute. No credit card required to browse. Merchants get their first month with zero fees.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={onEnter}
                className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[var(--color-accent-hover)] transition-colors text-sm">
                Start shopping free <ArrowRight size={16} />
              </button>
              <button onClick={onEnter}
                className="flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors text-sm border border-white/20">
                <Store size={15} /> Open a merchant store
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────
function Footer() {
  const cols = [
    {
      heading: "Markto",
      links: ["About us", "Careers", "Press", "Blog", "Investor relations"],
    },
    {
      heading: "Buyers",
      links: ["How to shop", "Buyer protection", "Returns policy", "Track an order", "Payment methods"],
    },
    {
      heading: "Merchants",
      links: ["Sell on Markto", "Merchant fees", "Logistics partners", "Merchant dashboard", "API documentation"],
    },
    {
      heading: "Support",
      links: ["Help centre", "Contact us", "Dispute resolution", "Report a listing", "Community forum"],
    },
  ];

  return (
    <footer className="bg-[var(--color-sidebar)] border-t border-[var(--color-sidebar-border)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                <Store size={15} className="text-white" />
              </div>
              <span className="font-[var(--font-display)] text-white font-semibold text-xl">Markto</span>
            </div>
            <p className="text-white/40 text-xs leading-relaxed mb-4">
              Nigeria's first AI-native marketplace. Built for buyers and merchants who demand more.
            </p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-white/30 text-[10px]">All systems operational</span>
            </div>
          </div>

          {cols.map(c => (
            <div key={c.heading}>
              <h4 className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-4">{c.heading}</h4>
              <ul className="space-y-2.5">
                {c.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-white/40 text-xs hover:text-white/70 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-[var(--color-sidebar-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">© 2024 Markto Technologies Ltd. RC 1234567. Lagos, Nigeria.</p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
              <a key={l} href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main export ─────────────────────────────────────────────
export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen">
      <Nav onEnter={onEnter} />
      <Hero onEnter={onEnter} />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <ForBuyers onEnter={onEnter} />
      <ForMerchants onEnter={onEnter} />
      <Categories onEnter={onEnter} />
      <Pricing onEnter={onEnter} />
      <Testimonials />
      <TrustSection />
      <FAQ />
      <CTABanner onEnter={onEnter} />
      <Footer />
    </div>
  );
}
