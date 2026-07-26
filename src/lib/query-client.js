import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// Content is prefetched once per session (see ContentPrefetcher) and
			// treated as fresh for the whole session, so navigating between pages
			// never re-fetches or shows "loading...". A full page reload always
			// gets fresh data; admin edits show after a reload.
			staleTime: Infinity,
			gcTime: Infinity,
		},
	},
});