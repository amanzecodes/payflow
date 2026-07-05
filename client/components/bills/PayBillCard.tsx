"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { HiOutlineCheckCircle } from "react-icons/hi2";

import { CustomSelect } from "@/components/onboarding/CustomSelect";
import { DATA_PLANS, DISTRIBUTORS, METER_TYPES, NETWORKS, formatNaira } from "./data";
import type { BillPurchase, BillTab } from "./types";

interface PayBillCardProps {
  walletBalance: number;
  onPurchase: (purchase: BillPurchase) => void;
}

const TABS: { label: string; value: BillTab }[] = [
  { label: "Airtime", value: "AIRTIME" },
  { label: "Data", value: "DATA" },
  { label: "Electricity", value: "ELECTRICITY" },
];

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;

const PayBillCard = ({ walletBalance, onPurchase }: PayBillCardProps) => {
  const [activeTab, setActiveTab] = useState<BillTab>("AIRTIME");
  const [submitting, setSubmitting] = useState(false);

  const [network, setNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dataPlanId, setDataPlanId] = useState("");

  const [distributor, setDistributor] = useState("EKEDC");
  const [meterType, setMeterType] = useState("PREPAID");
  const [meterNumber, setMeterNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");

  const plans = DATA_PLANS[network] ?? [];
  const selectedPlan = plans.find((plan) => plan.value === dataPlanId);
  const amountValue = Number(amount);

  const resetSharedFields = () => {
    setPhone("");
    setAmount("");
  };

  const switchTab = (tab: BillTab) => {
    setActiveTab(tab);
  };

  const handleMeterNumberChange = (value: string) => {
    setMeterNumber(value.replace(/\D/g, "").slice(0, 13));
    setVerifiedName("");
  };

  const handleVerifyMeter = () => {
    if (meterNumber.length < 10) {
      toast.error("Enter a valid 10-13 digit meter number");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifiedName("ADEOLA A. BAKARE");
      setVerifying(false);
    }, 900);
  };

  const canBuyAirtime = network && phone.length >= 10 && amountValue >= MIN_AMOUNT && amountValue <= MAX_AMOUNT && amountValue <= walletBalance;
  const canBuyData = network && phone.length >= 10 && Boolean(selectedPlan) && (selectedPlan?.amount ?? 0) <= walletBalance;
  const canBuyElectricity =
    distributor && meterType && meterNumber.length >= 10 && phone.length >= 10 && amountValue >= MIN_AMOUNT && amountValue <= walletBalance;

  const handleBuy = async () => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    if (activeTab === "AIRTIME") {
      onPurchase({
        id: `bill_${Date.now()}`,
        type: "AIRTIME",
        provider: network,
        identifier: phone,
        amount: amountValue,
        status: "SUCCESS",
        createdAt: new Date().toISOString(),
      });
      toast.success(`${formatNaira(amountValue)} airtime sent to ${phone}`);
      resetSharedFields();
    } else if (activeTab === "DATA" && selectedPlan) {
      onPurchase({
        id: `bill_${Date.now()}`,
        type: "DATA",
        provider: network,
        identifier: phone,
        amount: selectedPlan.amount,
        status: "SUCCESS",
        createdAt: new Date().toISOString(),
      });
      toast.success(`${selectedPlan.label.split(" - ")[0]} data sent to ${phone}`);
      resetSharedFields();
      setDataPlanId("");
    } else if (activeTab === "ELECTRICITY") {
      onPurchase({
        id: `bill_${Date.now()}`,
        type: "ELECTRICITY",
        provider: distributor,
        identifier: meterNumber,
        amount: amountValue,
        status: "SUCCESS",
        createdAt: new Date().toISOString(),
      });
      toast.success(`${formatNaira(amountValue)} token generated for meter ${meterNumber}`);
      resetSharedFields();
      setMeterNumber("");
      setEmail("");
      setVerifiedName("");
    }

    setSubmitting(false);
  };

  const isDisabled =
    submitting ||
    (activeTab === "AIRTIME" && !canBuyAirtime) ||
    (activeTab === "DATA" && !canBuyData) ||
    (activeTab === "ELECTRICITY" && !canBuyElectricity);

  const buttonLabel = submitting
    ? "Processing…"
    : activeTab === "AIRTIME"
    ? "Buy airtime"
    : activeTab === "DATA"
    ? "Buy data"
    : "Buy electricity";

  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200">
      <p className="text-base font-bold text-zinc-900">Pay a bill</p>
      <p className="text-sm text-zinc-500 mt-1">Charge your wallet for airtime, data, and electricity.</p>

      <div className="flex items-center gap-1 p-1 mt-5 rounded-lg bg-zinc-100 w-full sm:w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => switchTab(tab.value)}
              className="relative flex-1 sm:flex-none px-5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer"
            >
              {isActive && (
                <motion.span
                  layoutId="active-bill-tab"
                  className="absolute inset-0 rounded-md bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? "text-zinc-900" : "text-zinc-500"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-5">
        {activeTab === "AIRTIME" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Network</label>
                <CustomSelect value={network} onChange={setNetwork} options={NETWORKS} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="0801 234 5678"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₦</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-2">Minimum ₦50, maximum ₦50,000.</p>
            </div>
          </>
        )}

        {activeTab === "DATA" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Network</label>
                <CustomSelect
                  value={network}
                  onChange={(value) => {
                    setNetwork(value);
                    setDataPlanId("");
                  }}
                  options={NETWORKS}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="0801 234 5678"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Data plan</label>
              <CustomSelect
                value={dataPlanId}
                onChange={setDataPlanId}
                options={plans}
                placeholder="Choose a plan"
              />
            </div>
          </>
        )}

        {activeTab === "ELECTRICITY" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Power distributor</label>
                <CustomSelect value={distributor} onChange={setDistributor} options={DISTRIBUTORS} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Meter type</label>
                <CustomSelect value={meterType} onChange={setMeterType} options={METER_TYPES} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Meter number</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(event) => handleMeterNumberChange(event.target.value)}
                  placeholder="10-13 digit meter number"
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={handleVerifyMeter}
                  disabled={verifying}
                  className="shrink-0 px-4 py-2.5 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? "Verifying…" : "Verify meter"}
                </button>
              </div>
              {verifiedName && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2">
                  <HiOutlineCheckCircle size={14} />
                  Meter verified: {verifiedName} · {meterType === "PREPAID" ? "Prepaid" : "Postpaid"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="0801 234 5678"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">Email (for token receipt)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₦</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-50 text-sm">
          <span className="text-zinc-500">Wallet balance</span>
          <span className="font-bold text-zinc-900">{formatNaira(walletBalance)}</span>
        </div>

        <button
          type="button"
          onClick={handleBuy}
          disabled={isDisabled}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-6 py-3.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default PayBillCard;
