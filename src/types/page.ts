export type Sort = {
	empty: boolean;
	sorted: boolean;
	unsorted: boolean;
};

export type Pagination = {
	pageNumber: number;
	pageSize: number;
	offset: number;
	paged: boolean;
	unpaged: boolean;
	sort: Sort;
};
