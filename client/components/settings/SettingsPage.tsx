"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  INITIAL_COLLECTION,
  INITIAL_FEE_LINES,
  INITIAL_ORGANISATION,
  INITIAL_PAYOUT_ACCOUNT,
} from "./data";
import { panelVariants } from "./animations";
import SettingsTabs from "./SettingsTabs";
import OrganisationPanel from "./OrganisationPanel";
import CollectionPanel from "./CollectionPanel";
import FeeLinesPanel from "./FeeLinesPanel";
import PayoutAccountPanel from "./PayoutAccountPanel";
import type { SettingsTab } from "./types";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("organisation");
  const [organisation, setOrganisation] = useState(INITIAL_ORGANISATION);
  const [collection, setCollection] = useState(INITIAL_COLLECTION);
  const [feeLines, setFeeLines] = useState(INITIAL_FEE_LINES);
  const [payoutAccount, setPayoutAccount] = useState(INITIAL_PAYOUT_ACCOUNT);

  const handleOrganisationSave = (next: typeof organisation) => {
    setOrganisation(next);
    if (next.type !== "Flow B" && activeTab === "fee-lines") {
      setActiveTab("organisation");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
          Configure your organisation, collections, fee lines, and payout destination.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        <div className="p-3 rounded-xl bg-white border border-zinc-200">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} orgType={organisation.type} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.18 }}
          >
            {activeTab === "organisation" && (
              <OrganisationPanel organisation={organisation} onSave={handleOrganisationSave} />
            )}
            {activeTab === "collection" && (
              <CollectionPanel collection={collection} onSave={setCollection} />
            )}
            {activeTab === "fee-lines" && organisation.type === "Flow B" && (
              <FeeLinesPanel feeLines={feeLines} onChange={setFeeLines} />
            )}
            {activeTab === "payout-account" && (
              <PayoutAccountPanel account={payoutAccount} onSave={setPayoutAccount} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;
