/** Page size for Explore and search results; divisible by 2 and 3, so full pages fill the grid's rows. */
export const EXPLORE_PAGE_SIZE = 24;

/** Page size for the notifications list. */
export const NOTIFICATIONS_PAGE_SIZE = 20;

/** How long search fields wait for a pause in typing before asking the API. */
export const SEARCH_DEBOUNCE_MS = 300;

/** The shortest search the API accepts (`vote.search.query_too_short` below it). */
export const SEARCH_MIN_LENGTH = 2;

/** Whether a trimmed search is long enough to send. Counts characters as the API does, so one emoji is one. */
export const isSearchable = (q: string) => [...q].length >= SEARCH_MIN_LENGTH;
