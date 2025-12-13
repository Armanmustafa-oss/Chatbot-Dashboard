// import { createTRPCReact } from "@trpc/react-query";
// import type { AppRouter } from "../../../server/routers";

// export const trpc = createTRPCReact<AppRouter>();


// client/src/lib/trpc.ts
export const trpc = {
  analytics: {
    getDailyData: {
      useQuery: () => ({ data: null, isLoading: false, isError: false }),
    },
    getHourlyPeakTimes: {
      useQuery: () => ({ data: null, isLoading: false, isError: false }),
    },
    getKPISummary: {
      useQuery: () => ({ data: null, isLoading: false, isError: false }),
    },
    getTopQueries: {
      useQuery: () => ({ data: null, isLoading: false, isError: false }),
    },
    getTopIndividualQueries: {
      useQuery: () => ({ data: null, isLoading: false, isError: false }),
    },
  },
};