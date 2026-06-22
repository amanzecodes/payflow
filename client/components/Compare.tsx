const rows = [
  {
    title: "Know exactly who paid",
    detail: "Every transfer matched to a customer, automatically",
  },
  {
    title: "Dedicated business account number",
    detail: "Not a personal account shared across everyone",
  },
  {
    title: "Real-time balance & dashboard",
    detail: "See who's paid, who's owing, updated the moment money lands",
  },
  {
    title: "No screenshots or follow-up messages",
    detail: "No more chasing 'abeg confirm you don pay'",
  },
  {
    title: "Works for any amount, any time",
    detail: "Fixed dues or one-off contributions — matching works the same way",
  },
  {
    title: "A record that outlives the treasurer",
    detail: "If the person managing it changes, the history doesn't disappear with them",
  },
  {
    title: "Payout on demand, from WhatsApp",
    detail: "Text to withdraw, no app to download",
  },
];

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="size-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="size-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const Compare = () => {
  return (
    <section className="bg-linear-to-b from-blue-200 via-blue-100 to-white px-6 py-24">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          How We Compare
        </h2>
        <p className="mt-3 text-foreground/60">
          Why PayFlow beats tracking payments by hand
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-foreground/10 bg-white">
        <div className="grid grid-cols-[1fr_72px_72px] items-center gap-2 border-b border-foreground/10 px-4 py-4 sm:grid-cols-[1fr_140px_140px] sm:gap-0 sm:px-6">
          <span className="text-sm font-medium text-foreground/50">
            Offerings
          </span>
          <span className="rounded-full bg-black py-2 text-center text-sm font-semibold text-white">
            PayFlow
          </span>
          <span className="text-center text-sm font-medium text-foreground/50">
            Manual tracking
          </span>
        </div>

        {rows.map((row, index) => (
          <div
            key={row.title}
            className={`grid grid-cols-[1fr_72px_72px] items-center gap-2 px-4 py-6 sm:grid-cols-[1fr_140px_140px] sm:gap-0 sm:px-6 ${
              index !== rows.length - 1 ? "border-b border-foreground/10" : ""
            }`}
          >
            <div>
              <p className="font-medium text-lg tracking-tight">{row.title}</p>
              <p className="mt-1 text-sm text-foreground/50">{row.detail}</p>
            </div>

            <div className="flex justify-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F7A4D]/10 text-[#1F7A4D]">
                <CheckIcon />
              </span>
            </div>

            <div className="flex justify-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C44536]/10 text-[#C44536]">
                <CrossIcon />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Compare;
