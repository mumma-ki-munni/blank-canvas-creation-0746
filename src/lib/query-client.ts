import { QueryClient } from "@tanstack/react-query";

// Shared React Query client. Exported so `signOut` can clear the cache
// (see AuthProvider) and so all data hooks share one cache.
export const queryClient = new QueryClient();
