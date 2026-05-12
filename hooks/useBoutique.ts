import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { mapBoutiqueDetailForProfile } from "@/services/boutique.service";
import { getBoutiqueById } from "@/services/api";
import type { BoutiqueProfileViewModel } from "@/lib/boutiques/boutiqueUi";

const boutiqueDetailKey = (id: string) => ["boutique", "detail", id] as const;

/**
 * Normalized boutique profile for any screen (Contact, Profile, etc.).
 * Refetches when the screen gains focus so Admin edits show up without manual refresh.
 */
export function useBoutique(boutiqueId: string | undefined) {
  const queryClient = useQueryClient();
  const id = boutiqueId?.trim() ?? "";

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void queryClient.invalidateQueries({ queryKey: boutiqueDetailKey(id) });
    }, [id, queryClient]),
  );

  return useQuery({
    queryKey: boutiqueDetailKey(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<BoutiqueProfileViewModel | null> => {
      const row = await getBoutiqueById(id);
      if (!row) return null;
      return mapBoutiqueDetailForProfile(row);
    },
    staleTime: 0,
    gcTime: 5 * 60_000,
  });
}
