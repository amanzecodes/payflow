import Image from 'next/image'

const Sponsor = () => {
  return (
    <section className="flex flex-col items-center gap-6 px-4 py-12 sm:gap-8 sm:px-6 sm:py-20">
      <p className="text-sm font-medium tracking-tight text-foreground/60 sm:text-md">
        Our Sponsors
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        <Image
          src="/logos/nomba.webp"
          alt="Nomba"
          width={320}
          height={200}
          className="h-20 w-auto object-contain opacity-80 sm:h-28 md:h-40"
        />
        <span className="text-2xl font-light text-foreground/40 sm:text-3xl">×</span>
        <Image
          src="/logos/devcareer.svg"
          alt="DevCareer"
          width={320}
          height={96}
          className="h-6 w-auto object-contain opacity-80 sm:h-8 md:h-10"
        />
      </div>
    </section>
  )
}

export default Sponsor
