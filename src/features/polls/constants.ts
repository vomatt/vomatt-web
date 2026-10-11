/** Page size for Explore and search results. */
export const EXPLORE_PAGE_SIZE = 20;

/**
 * The deployed API's /votes lists Open Polls only and ignores `status` and
 * `q`, so Explore hides its search and Ended filter until the API has them.
 */
export const EXPLORE_FILTERS_AVAILABLE = false;

/** The shortest search the API accepts (`vote.search.query_too_short` below it). */
export const SEARCH_MIN_LENGTH = 2;
