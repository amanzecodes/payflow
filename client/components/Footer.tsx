const columns = [
  {
    title: "Product",
    links: ["How it works", "Pricing", "WhatsApp setup"],
  },
  {
    title: "Company",
    links: ["About", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy policy", "Terms of service"],
  },
];

const Footer = () => {
  return (
    <footer className="bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <span className="text-lg font-semibold">Payflow</span>
            <p className="mt-3 text-sm text-white/50">
              A dedicated account for your business. Every payment matched,
              automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-semibold text-white/80">
                  {column.title}
                </h4>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-white/50 transition-colors hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Payflow. All rights reserved.
          </p>
          <p className="text-sm text-white/40">
            Built on Nomba payment infrastructure
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
