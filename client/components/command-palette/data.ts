import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBanknotes,
  HiOutlineCog6Tooth,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import type { CommandGroup } from "./types";

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    label: "Primary",
    items: [
      { name: "Overview", href: "/dashboard", icon: HiOutlineSquares2X2 },
      { name: "Members", href: "/members", icon: HiOutlineUserGroup },
      { name: "Payouts", href: "/payout", icon: HiOutlineBanknotes },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/settings", icon: HiOutlineCog6Tooth },
      { name: "Sign out", href: "/login", icon: HiOutlineArrowLeftOnRectangle },
    ],
  },
];
