// ─────────────────────────────────────────────────────────────
// STEP 1 — In SplashScreen.tsx, add these keyframes inside STYLES
// (put them before the `@media (prefers-reduced-motion...)` block)
// ─────────────────────────────────────────────────────────────
/*
@keyframes leo-twinkle { 0%,100% { opacity: .15; transform: scale(.7); } 50% { opacity: 1; transform: scale(1); } }
@keyframes leo-ring { to { transform: rotate(360deg); } }
@keyframes leo-pop { 0% { opacity: 0; transform: scale(.85); } 100% { opacity: 1; transform: scale(1); } }
.leo-twinkle { animation: leo-twinkle var(--tw-dur, 3.2s) ease-in-out infinite; animation-delay: var(--tw-delay, 0s); }
.leo-ring { animation: leo-ring 14s linear infinite; }
.leo-pop { animation: leo-pop 650ms cubic-bezier(.22,1,.36,1) both; }

and extend the reduced-motion selector list with:  .leo-twinkle, .leo-ring, .leo-pop
*/

// ─────────────────────────────────────────────────────────────
// STEP 2 — Replace the whole old BirthdayCard function with this
// (Cake and Sparkles are already imported in your file)
// ─────────────────────────────────────────────────────────────

const SPARKS = [
  { left: "9%",  top: "12%", size: 6, delay: "0s",   dur: "3.4s" },
  { left: "86%", top: "9%",  size: 8, delay: "0.8s", dur: "2.9s" },
  { left: "93%", top: "46%", size: 5, delay: "1.6s", dur: "3.8s" },
  { left: "5%",  top: "58%", size: 5, delay: "2.1s", dur: "3.1s" },
  { left: "78%", top: "88%", size: 6, delay: "1.2s", dur: "3.6s" },
  { left: "20%", top: "92%", size: 7, delay: "0.4s", dur: "3.3s" },
];

function Spark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill="#f1d77f" />
    </svg>
  );
}

function BirthdayAvatar({ member, size }: { member: Member; size: number }) {
  const inner = size - 8;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* rotating gold ring */}
      <div
        className="leo-ring absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg,#8a6a12,#f5e5a8,#d4af37,#fff3c4,#8a6a12 60%,#d4af37,#8a6a12)",
        }}
      />
      {/* dark gap between ring and photo */}
      <div className="absolute rounded-full bg-[#2a0f26]" style={{ inset: 3 }} />
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.name}
          width={inner}
          height={inner}
          loading="eager"
          decoding="async"
          className="absolute rounded-full object-cover"
          style={{ inset: 4, width: inner, height: inner }}
        />
      ) : (
        <div
          className="absolute flex items-center justify-center rounded-full bg-white/10 font-bold text-[#f1d77f]"
          style={{ inset: 4, width: inner, height: inner, fontSize: size * 0.38 }}
        >
          {member.name.trim().charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

const SERIF = 'Georgia,"Times New Roman",serif';

function BirthdayCard({ members }: { members: Member[] }) {
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  const single = members.length === 1;

  return (
    <div
      className="relative isolate overflow-hidden"
      style={{
        background:
          "radial-gradient(28rem 18rem at 50% -8%,rgba(212,175,55,.22),transparent 65%),linear-gradient(170deg,#3a1233 0%,#240d2b 55%,#12102a 100%)",
      }}
    >
      {/* gold hairline frame */}
      <div className="pointer-events-none absolute inset-2 rounded-[1.6rem] border border-[#d4af37]/30" />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,236,170,.35)]" />

      {/* twinkling sparks */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className={`leo-twinkle absolute ${i > 3 ? "hidden sm:block" : ""}`}
            style={
              {
                left: s.left,
                top: s.top,
                "--tw-delay": s.delay,
                "--tw-dur": s.dur,
              } as React.CSSProperties
            }
          >
            <Spark size={s.size} />
          </span>
        ))}
      </div>

      <div className="relative px-6 pb-7 pt-9 text-center sm:px-9 sm:pb-9 sm:pt-11">
        {/* header */}
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-3.5 py-1.5 text-xs font-medium text-[#f3d77e]">
          <Cake size={14} />
          A Leo family celebration
        </div>

        <h2
          className="leo-shimmer-text mt-5 text-4xl font-bold leading-tight sm:text-5xl"
          style={{ fontFamily: SERIF }}
        >
          Happy Birthday
        </h2>

        {/* ornament divider */}
        <div className="mx-auto my-5 flex max-w-[16rem] items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/70" />
          <Sparkles size={14} className="text-[#f1d77f]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/70" />
        </div>

        {/* celebrants */}
        {single ? (
          <div className="leo-pop flex flex-col items-center">
            <BirthdayAvatar member={shown[0]} size={116} />
            <h3
              className="mt-5 text-2xl font-semibold leading-snug text-white sm:text-3xl"
              style={{ fontFamily: SERIF }}
            >
              {shown[0].name}
            </h3>
            <p className="mt-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-pink-100/85">
              {shown[0].currentRole || "Leo Club Member"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            {shown.map((member, i) => (
              <div
                key={member.memberId}
                className="leo-pop flex items-center gap-4 rounded-2xl border border-[#d4af37]/20 bg-white/[0.05] p-3"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <BirthdayAvatar member={member} size={64} />
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-white" style={{ fontFamily: SERIF }}>
                    {member.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-pink-100/75">
                    {member.currentRole || "Leo Club Member"}
                  </p>
                </div>
              </div>
            ))}
            {extra > 0 && (
              <p className="pt-1 text-center text-xs text-pink-100/70">
                and {extra} more member{extra === 1 ? "" : "s"} celebrating today
              </p>
            )}
          </div>
        )}

        {/* message */}
        <p className="mx-auto mt-6 max-w-xs text-sm leading-6 text-white/75">
          Wishing you a year of good health, meaningful moments and new opportunities.
          Warm wishes from everyone at Leo Club of KUSMS.
        </p>

        <p className="mt-6 text-[11px] leading-5 text-white/40">
          Leo Club of Kathmandu University School of Medical Sciences, District 325L
        </p>
      </div>
    </div>
  );
}
