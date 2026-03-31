export interface PollCreateOption {
	id: string;
	text: string;
	description?: string;
}

export interface PollCreatorData {
	title: string;
	description?: string;
	options: PollCreateOption[];
	startTime: string;
	endTime?: string;
	allowMultipleChoices: boolean;
	anonymous: boolean;
	tagIds?: string[];
}

export type PollOption = {
	id: string;
	text: string;
	votes: number;
	[key: string]: any; // optional, for extra fields if needed
};

export type TagDto = {
	id: string;
	name: string;
	slug: string;
	description?: string;
	displayOrder?: number;
	usageCount?: number;
};

export type Poll = {
	id: string;
	title: string;
	description: string;
	active: boolean;
	votingActive: boolean;
	allowMultipleChoices: boolean;
	anonymous: boolean;
	creatorId: string;
	creatorUsername: string;
	createdAt: string; // ISO timestamp
	updatedAt: string; // ISO timestamp
	startTime: string;
	endTime: string | null;
	totalVotes: number;
	success: boolean;
	errorCode: string | null;
	options: PollOption[];
	tags?: TagDto[];
	comments?: Comment[];
};

interface Comment {
	id: string;
	author: string;
	text: string;
	createdAt: string;
}
