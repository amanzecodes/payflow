"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineBanknotes, HiOutlineCheckCircle, HiOutlineXMark } from "react-icons/hi2";

import { backdropVariants, modalVariants } from "./animations";
import CopyButton from "./CopyButton";
import { useAddMember } from "@/hooks/members/use-add-member";
import { getApiErrorMessage } from "@/lib/api/error";
import { WHATSAPP_JOIN_CODE, WHATSAPP_JOIN_NUMBER } from "@/constants/whatsapp.constants";
import type { OrgType, Structure, Member } from "@/types/onboarding.types";

const IDENTIFIER_LABELS: Record<OrgType, string> = {
  ESTATE: "Flat / Unit Number",
  COOPERATIVE: "Member ID",
  GYM: "Member Name",
  SCHOOL: "Student Name",
  CLINIC: "Patient ID",
  OTHER: "Identifier",
};

const PHONE_REGEX = /^(\+234|0)[0-9]{10}$/;

const normalizePhone = (phone: string): string => {
  const trimmed = phone.trim().replace(/\s/g, "");
  return trimmed.startsWith("0") ? `+234${trimmed.slice(1)}` : trimmed;
};

interface FieldErrors {
  name?: string;
  identifier?: string;
  phone?: string;
}

const validate = (name: string, identifier: string, identifierLabel: string, phone: string): FieldErrors => {
  const errors: FieldErrors = {};
  if (!name.trim() || name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  if (!identifier.trim()) {
    errors.identifier = `${identifierLabel} is required`;
  }
  if (!phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!PHONE_REGEX.test(phone.trim().replace(/\s/g, ""))) {
    errors.phone = "Enter a valid Nigerian number (e.g. 08012345678)";
  }
  return errors;
};

// The API doesn't return field-keyed validation errors, so we do a
// best-effort match on the message text to place it under the right field.
const mapServerErrorToField = (message: string): keyof FieldErrors | null => {
  const lower = message.toLowerCase();
  if (lower.includes("phone")) return "phone";
  if (lower.includes("identifier")) return "identifier";
  if (lower.includes("name")) return "name";
  return null;
};

interface AddMemberPanelProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgType: OrgType;
  structure: Structure;
  expectedAmount: number;
  inviteCode?: string;
  onMemberCreated: () => void;
}

const AddMemberPanel = ({
  open,
  onClose,
  orgId,
  orgType,
  structure,
  expectedAmount,
  inviteCode,
  onMemberCreated,
}: AddMemberPanelProps) => {
  const identifierLabel = IDENTIFIER_LABELS[orgType];
  const addMember = useAddMember();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);

  const resetForm = () => {
    setName("");
    setIdentifier("");
    setPhone("");
    setFieldErrors({});
    setGeneralError(null);
    setCreatedMember(null);
  };

  const resetAndClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralError(null);

    const errors = validate(name, identifier, identifierLabel, phone);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const member = await addMember.mutateAsync({
        orgId,
        payload: {
          name: name.trim(),
          identifier: identifier.trim(),
          phone: normalizePhone(phone),
          expectedAmount,
        },
      });
      setCreatedMember(member);
      onMemberCreated();
    } catch (err) {
      const message = getApiErrorMessage(err, "Something went wrong. Please try again.");
      const field = mapServerErrorToField(message);
      if (field) {
        setFieldErrors((prev) => ({ ...prev, [field]: message }));
      } else {
        setGeneralError(message);
      }
    }
  };

  const accountCardText = createdMember
    ? `${createdMember.name} — ${createdMember.identifier}\n${createdMember.vaBankName}\n${createdMember.vaNumber}\nAccepts exactly ₦${createdMember.expectedAmount.toLocaleString()}`
    : "";

  const title =
    structure === "VARIABLE" ? "Share Join Code" : createdMember ? "Member Added" : "Add Member";
  const subtitle =
    structure === "VARIABLE"
      ? "Members join themselves via WhatsApp"
      : createdMember
        ? "Their dedicated account is ready"
        : "Enroll a new member into this cycle";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center px-4 py-8"
          onClick={resetAndClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md max-h-full bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-zinc-100">
              <div>
                <p className="text-sm font-bold text-zinc-900">{title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
              </div>
              <button
                onClick={resetAndClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors shrink-0"
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            {structure === "VARIABLE" ? (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 text-center">
                    Invite Code
                  </p>
                  <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <code className="font-mono text-2xl font-bold text-[#0b79ff] tracking-wider">
                      {inviteCode || "—"}
                    </code>
                    {inviteCode && <CopyButton value={inviteCode} />}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    How members join
                  </p>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="h-6 w-6 rounded-full bg-[#0b79ff] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-700">
                        On WhatsApp, text <span className="font-semibold text-zinc-900">&ldquo;{WHATSAPP_JOIN_CODE}&rdquo;</span> to:
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm font-mono font-semibold text-zinc-900">
                          {WHATSAPP_JOIN_NUMBER}
                        </code>
                        <CopyButton value={WHATSAPP_JOIN_NUMBER} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="h-6 w-6 rounded-full bg-[#0b79ff] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p className="text-sm text-zinc-700 flex-1">
                      Then send the invite code above to the same number to register and select their fee
                      plan. Each member gets their own dedicated account number automatically.
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetAndClose}
                  className="w-full bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            ) : createdMember ? (
              <div className="p-6 space-y-5">
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <span className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <HiOutlineCheckCircle size={26} />
                  </span>
                  <p className="text-sm font-semibold text-zinc-900">
                    {createdMember.name} — {createdMember.identifier}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium mb-1">Bank</p>
                    <p className="text-sm font-semibold text-zinc-900">{createdMember.vaBankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium mb-1">Account Number</p>
                    <p className="text-sm font-mono font-semibold text-zinc-900">{createdMember.vaNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium mb-1">Accepts Exactly</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      ₦{createdMember.expectedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <CopyButton value={accountCardText} />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg py-3 transition-colors"
                  >
                    Add Another Member
                  </button>
                  <button
                    onClick={resetAndClose}
                    className="flex-1 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3 transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Full Name
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Bisi Adeyemi"
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.name
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-zinc-200 focus:border-[#0b79ff]/40 focus:ring-[#0b79ff]/10"
                    }`}
                  />
                  {fieldErrors.name && <p className="text-xs text-rose-600 mt-1.5">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    {identifierLabel}
                  </label>
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={`e.g. ${identifierLabel}`}
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.identifier
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-zinc-200 focus:border-[#0b79ff]/40 focus:ring-[#0b79ff]/10"
                    }`}
                  />
                  {fieldErrors.identifier && (
                    <p className="text-xs text-rose-600 mt-1.5">{fieldErrors.identifier}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="08012345678 or +2348012345678"
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.phone
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-zinc-200 focus:border-[#0b79ff]/40 focus:ring-[#0b79ff]/10"
                    }`}
                  />
                  {fieldErrors.phone && <p className="text-xs text-rose-600 mt-1.5">{fieldErrors.phone}</p>}
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0b79ff]/5 border border-[#0b79ff]/10">
                  <HiOutlineBanknotes size={18} className="text-[#0b79ff] shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    A dedicated account will be automatically provisioned for this member once created.
                  </p>
                </div>

                {generalError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                    <p className="text-sm font-medium text-rose-700">{generalError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addMember.isPending}
                  className="w-full bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addMember.isPending ? "Creating Member…" : "Create Member"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberPanel;
