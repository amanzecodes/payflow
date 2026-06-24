"use client";

import { useState } from "react";
import { HiOutlineCheck, HiOutlineClipboard } from "react-icons/hi2";

interface CopyButtonProps {
  value: string;
}

const CopyButton = ({ value }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
    >
      {copied ? (
        <>
          <HiOutlineCheck size={13} className="text-emerald-600" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <HiOutlineClipboard size={13} />
          Copy
        </>
      )}
    </button>
  );
};

export default CopyButton;
