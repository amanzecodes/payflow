import type { IconType } from "react-icons";

export interface CommandItem {
  name: string;
  href: string;
  icon: IconType;
}

export interface CommandGroup {
  label: string;
  items: CommandItem[];
}
