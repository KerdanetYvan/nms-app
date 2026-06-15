import { useCallback } from "react";
import { openUsageAccessSettings } from "@/src/utils/permissions";

export function usePermissions() {
  const openUsageAccess = useCallback(() => {
    openUsageAccessSettings();
  }, []);

  return { openUsageAccess };
}
