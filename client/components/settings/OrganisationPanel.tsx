"use client";

import { useState } from "react";

import SavedIndicator from "./SavedIndicator";
import type { OrganisationSettings, OrgType } from "./types";

interface OrganisationPanelProps {
  organisation: OrganisationSettings;
  onSave: (organisation: OrganisationSettings) => void;
}

const OrganisationPanel = ({ organisation, onSave }: OrganisationPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(organisation.name);
  const [type, setType] = useState<OrgType>(organisation.type);
  const [justSaved, setJustSaved] = useState(false);

  const handleEdit = () => {
    setName(organisation.name);
    setType(organisation.type);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(organisation.name);
    setType(organisation.type);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave({ name, type });
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Organisation</h2>
          <p className="text-xs text-zinc-400 mt-1">Your organisation&apos;s name and billing structure</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedIndicator show={justSaved} />
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Organisation Name
          </label>
          {isEditing ? (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
            />
          ) : (
            <p className="text-sm font-semibold text-zinc-900">{organisation.name}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Organisation Type
          </label>
          {isEditing ? (
            <div className="flex gap-3">
              {(["Flow A", "Flow B"] as OrgType[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setType(option)}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold border transition-colors ${
                    type === option
                      ? "border-[#0b79ff]/40 bg-[#0b79ff]/5 text-[#0b79ff]"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-900">{organisation.type}</p>
          )}
          <p className="text-xs text-zinc-400 mt-2">
            Flow B organisations can break collections down into individual fee lines.
          </p>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganisationPanel;
