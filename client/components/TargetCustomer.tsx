const customers = [
  {
    title: "Cooperatives & contribution groups",
    description:
      "Members send dues every cycle. The treasurer no longer tracks it by hand.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Lesson teachers & tutors",
    description:
      "Parents pay per term or per session, automatically tied to the right student.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    ),
  },
  {
    title: "Gyms & fitness studios",
    description:
      "Members pay monthly. Know exactly who's current and who's owing, at a glance.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 8.25v7.5M3 9.75v4.5M8.25 6.75v10.5M19.5 8.25v7.5M21 9.75v4.5M15.75 6.75v10.5M8.25 12h7.5"
        />
      </svg>
    ),
  },
  {
    title: "Churches & community giving",
    description:
      "Tithes and offerings transfer in like always. Every gift matched to a giver, no more screenshots.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    ),
  },
];

const TargetCustomer = () => {
  return (
    <section className="px-6 py-24">
      <div className="flex items-center justify-center">
        <h6 className="text-xs font-medium uppercase tracking-widest text-foreground/40">
          Who it's built for
        </h6>
      </div>

      <div className="mx-auto mt-6 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Payment infrastructure exists. It just wasn't built for businesses
          like yours.
        </h2>
        <p className="mt-4 text-foreground/60">
          If your customers transfer into one shared account and you're left
          guessing who paid what, PayFlow is built for you.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {customers.map((customer, index) => (
          <div
            key={customer.title}
            className="border-beam flex flex-col gap-4 rounded-2xl bg-white p-8"
            style={
              {
                "--beam-duration": `${3.5 + index * 1.3}s`,
                "--beam-delay": `-${index * 0.9}s`,
              } as React.CSSProperties
            }
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B2A4A] text-white">
              {customer.icon}
            </div>
            <h3 className="font-semibold tracking-tight">{customer.title}</h3>
            <p className="text-sm leading-relaxed text-foreground/60">
              {customer.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TargetCustomer;
