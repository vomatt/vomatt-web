export interface PollOption {
	id: string;
	text: string;
}

export interface PollCreatorData {
	question: string;
	description?: string;
	options: PollOption[];
	startTime: string;
	endTime?: string;
	isAllowMultipleChoices: boolean;
	isAnonymous: boolean;
}
