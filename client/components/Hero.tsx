import Silk from './Silk'
import Button from './Button'
import { FaRegArrowAltCircleRight } from "react-icons/fa";

const Hero = () => {
  return (
    <div>
      <section className="relative text-white min-h-[80vh] md:min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Silk
            speed={5}
            scale={1}
            color="#5227FF"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight max-w-3xl">
          One account number. Every customer. Zero guesswork
        </h1>
        <p className="mt-6 text-lg text-white max-w-xl mt-2">
          Every transfer lands, matches a customer, and updates your
          dashboard — automatically.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Button variant="primary">Get Started</Button>

          <Button variant="secondary">
            <span className="flex items-center justify-center gap-2">
              See how it works <FaRegArrowAltCircleRight size={20} />
            </span>
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Hero