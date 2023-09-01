import type { PortableTextBlock } from '@portabletext/types';
import type { Image } from 'sanity';

export interface MenuItem {
	_type: string;
	slug?: string;
	title?: string;
}

export interface MainDataPayload {
	data?: any;
}
