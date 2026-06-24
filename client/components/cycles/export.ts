import type { Cycle } from "./types";

export const exportCycleToCsv = (cycle: Cycle) => {
  const header = ["Name", "Identifier", "Status", "Amount", "Payment Date", "Reference"];
  const rows = cycle.members.map((member) => [
    member.name,
    member.identifier,
    member.status,
    member.amount,
    member.paymentDate ?? "—",
    member.reference ?? "—",
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `payflow-cycle-${cycle.period.replace(/\s+/g, "-").toLowerCase()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

// No PDF library in the project yet — the browser's print dialog already offers
// "Save as PDF", so this is a dependency-free stand-in until a real exporter is wired up.
export const exportCycleToPdf = () => {
  window.print();
};
