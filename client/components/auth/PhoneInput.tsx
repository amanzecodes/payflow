import { HiOutlinePhone } from "react-icons/hi";

interface PhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function PhoneInput({ id, value, onChange, invalid }: PhoneInputProps) {
  return (
    <div className="relative flex items-stretch rounded-lg border bg-transparent focus-within:shadow-[inset_0_0_0_2px_rgba(11,121,255,0.35)] focus-within:border-transparent transition-all">
      <span className="flex items-center gap-2 pl-3.5 pr-2 text-foreground border-r">
        <HiOutlinePhone size={18} className="text-muted-foreground" />
        <span className="text-sm font-medium">+234</span>
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        className="w-full rounded-lg px-3 py-3.5 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        placeholder="800 000 0000"
        aria-invalid={invalid}
        required
      />
    </div>
  );
}
