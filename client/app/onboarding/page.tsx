"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Step1OrganisationDetails, type Step1Data } from "@/components/onboarding/Step1OrganisationDetails";
import { Step2CollectionSetup } from "@/components/onboarding/Step2CollectionSetup";
import { Step3AddMembers } from "@/components/onboarding/Step3AddMembers";
import { Step4Done } from "@/components/onboarding/Step4Done";
import type { FeeLine, Organisation } from "@/types/onboarding.types";
import { apiClient } from "@/lib/api/client";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function OnboardingPage() {
  const router = useRouter();
  const state = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin already has org
    const checkExistingOrg = async () => {
      try {
        const { data } = await apiClient.get<{ success: boolean; data: Organisation[] }>(
          "/organisations/my-orgs"
        );
        if (data.data && data.data.length > 0) {
          // Already onboarded, redirect to dashboard
          router.push("/dashboard");
        }
      } catch {
        // no existing org, stay on onboarding
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingOrg();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleStep1Next = (orgId: string, data: Step1Data) => {
    state.setOrgDetails({
      orgId,
      orgName: data.name,
      orgType: data.type,
      structure: data.structure,
    });
  };

  const handleStep2Next = (
    collectionId: string,
    collectionName: string,
    collectionCycle: string,
    collectionAmount?: number,
    feeLines?: FeeLine[]
  ) => {
    state.setCollectionDetails({
      collectionId,
      collectionName,
      collectionCycle,
      collectionAmount,
      feeLines,
    });
  };

  const handleBack = () => {
    if (state.step > 1) {
      state.setStep((state.step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleStep3Next = () => {
    if (state.structure === "VARIABLE" && state.orgId) {
      const fetchInviteCode = async () => {
        try {
          const { data } = await apiClient.get<{
            success: boolean;
            data: { inviteCode: string };
          }>(`/organisations/${state.orgId}/invite-code`);
          state.setInviteCode(data.data.inviteCode);
        } catch {
          console.error("Failed to fetch invite code");
          state.setStep(4);
        }
      };
      fetchInviteCode();
    } else {
      state.setStep(4);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${montserrat.className}`}>
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2.5">
          
          <span className="text-xl font-bold text-gray-900">PayFlow</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <ProgressBar current={state.step} onBack={handleBack} />

        <div className="bg-white rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">
            {state.step === 1 && "Setup Your PayFlet"}
            {state.step === 2 && "Create Collection"}
            {state.step === 3 && "Add Members"}
            {state.step === 4 && "You're All Set!"}
          </h1>

          <p className="text-gray-600 mb-8">
            {state.step === 1 &&
              "Tell us about your this PayFlet(payment outlet) and verify your payout account."}
            {state.step === 2 &&
              `${state.structure === "FLAT" ? "Set a flat amount for all members" : "Create fee lines for variable amounts"}`}
            {state.step === 3 &&
              `${state.structure === "FLAT" ? "Add members who will contribute" : "Share your invite code with members"}`}
            {state.step === 4 && "Your onboarding is complete!"}
          </p>

          {state.step === 1 && <Step1OrganisationDetails onNext={handleStep1Next} />}

          {state.step === 2 && state.orgId && state.structure && (
            <Step2CollectionSetup
              orgId={state.orgId}
              structure={state.structure}
              onNext={handleStep2Next}
            />
          )}

          {state.step === 3 && state.orgId && state.orgType && state.structure && (
            <Step3AddMembers
              orgId={state.orgId}
              orgType={state.orgType}
              structure={state.structure}
              collectionAmount={state.collectionAmount}
              onNext={handleStep3Next}
            />
          )}

          {state.step === 4 && state.orgId && state.orgName && state.collectionName && (
            <Step4Done
              orgId={state.orgId}
              orgName={state.orgName}
              collectionName={state.collectionName}
              collectionCycle={state.collectionCycle || ""}
              structure={state.structure || "FLAT"}
              memberCount={state.memberCount}
              inviteCode={state.inviteCode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
