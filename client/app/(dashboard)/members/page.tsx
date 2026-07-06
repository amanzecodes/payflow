import { Suspense } from "react";
import MembersPage from "@/components/members/MembersPage";

const Page = () => {
  return (
    <Suspense fallback={null}>
      <MembersPage />
    </Suspense>
  );
};

export default Page;
