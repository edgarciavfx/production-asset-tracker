"use server"

import { auth } from "@/lib/auth"
import { searchService } from "@/features/search/services/search-service"
import type { ActionResponse } from "@/types"
import type { SearchResults } from "@/features/search/services/search-service"

export async function globalSearchAction(
  query: string
): Promise<ActionResponse<SearchResults>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const results = await searchService.globalSearch(query)
  return { success: true, data: results }
}
