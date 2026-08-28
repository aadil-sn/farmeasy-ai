import { ArrowRight, Check, Leaf, LockKeyhole, Sprout } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";

const features = [
  "See every cost before you confirm",
  "Coordinate harvests with your FPO",
  "Get recommendations grounded in local signals",
];

export default function Login() {
  return (
    <main className="min-h-screen bg-[#f4f6f4] px-4 py-5 text-[#102017] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full overflow-hidden border border-[#d7e0d8] bg-[#fbfcfb] shadow-[0_28px_80px_rgba(28,55,40,.10)] lg:grid-cols-[1.08fr_.92fr]">
          <section className="relative hidden min-h-[680px] overflow-hidden bg-[#153e2a] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#c9def3]/80" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#efc4bd]/80" />
            <div className="absolute right-16 top-40 h-28 w-28 rotate-45 bg-[#f2dfa0]/90" />
            <div className="relative z-10 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-white text-[#153e2a]"><Sprout size={21} /></span>
              <span className="text-xl font-extrabold tracking-[-.06em]">FarmEasy <i className="font-light not-italic">AI</i></span>
            </div>
            <div className="relative z-10 max-w-md">
              <p className="eyebrow text-[#c7e5d2]">Transparent digital FPO</p>
              <h1 className="mt-5 text-5xl font-extrabold leading-[.98] tracking-[-.075em] xl:text-6xl">Grow with a market that shows its work.</h1>
              <p className="mt-6 max-w-sm text-sm leading-6 text-[#d5e4d9]">One calm workspace for farmers, FPO teams, and buyers to move produce from field to payment.</p>
              <div className="mt-9 space-y-4">{features.map(feature => <div key={feature} className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#c6ead6] text-[#153e2a]"><Check size={14} strokeWidth={3} /></span>{feature}</div>)}</div>
            </div>
            <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#b8cec0]"><span>Farmer-first infrastructure</span><span>01 / 03</span></div>
          </section>

          <section className="flex min-h-[680px] flex-col justify-center px-6 py-10 sm:px-14 lg:px-12 xl:px-20">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-9 flex items-center gap-3 lg:hidden"><span className="grid h-10 w-10 place-items-center bg-[#153e2a] text-white"><Leaf size={21} /></span><span className="text-xl font-extrabold tracking-[-.06em]">FarmEasy <i className="font-light not-italic">AI</i></span></div>
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#cfd9d0] bg-[#edf2ee] text-[#153e2a]"><LockKeyhole size={22} /></div>
                <p className="eyebrow mt-6">Welcome back</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-.07em]">Your market, in view.</h2>
                <p className="mt-3 text-sm leading-6 text-[#6b786f]">Sign in to your FarmEasy workspace and pick up where your supply chain left off.</p>
              </div>
              <div className="mt-8 border border-[#dce4de] bg-[#f7f9f7] p-5 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#c6ead6] text-[#153e2a]"><LockKeyhole size={17} /></div><p className="mt-3 text-sm font-bold">Secure sign-in via Manus</p><p className="mt-2 text-xs leading-5 text-[#6b786f]">FarmEasy AI uses Manus authentication to keep your account and marketplace activity protected. You’ll continue to the secure sign-in portal.</p></div>
              <button type="button" onClick={startLogin} className="group mt-3 flex h-12 w-full items-center justify-center gap-2 bg-[#153e2a] text-sm font-bold text-white transition-transform hover:bg-[#102017] active:scale-[.98]">Continue securely <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></button>
              <p className="mt-5 text-center text-[11px] leading-5 text-[#7c8980]">By continuing, you agree to use FarmEasy AI’s secure workspace sign-in. Demo users can explore the marketplace without creating a separate account.</p>
              <p className="mt-8 text-center text-sm text-[#65736a]">Just exploring? <Link href="/" className="font-bold text-[#153e2a] underline underline-offset-4">View the marketplace demo</Link></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
