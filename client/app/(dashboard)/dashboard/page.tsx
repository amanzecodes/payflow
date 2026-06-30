import { Suspense } from "react";
import DashboardLoading from "./loading";
import DashboardClientPage from "./dashboard-client";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClientPage />
    </Suspense>
  );
}
