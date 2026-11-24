import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LanguageProvider } from '@/contexts/LanguageContext';
import { AnnouncementBar } from '@/features/announcement/AnnouncementBar';
import type { Announcement } from '@/features/announcement/schema';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import type { LanguageCode } from '@/types';

let mockPathname = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));
// @portabletext/react ships ESM only, which Jest doesn't load
jest.mock('@/components/CustomPortableText', () => ({
	__esModule: true,
	default: ({ blocks }: { blocks: { children: { text: string }[] }[] }) =>
		blocks.map((block) => block.children.map((child) => child.text).join('')).join(' '),
}));

const block = (text: string) => ({ _type: 'block', _key: text, children: [{ _type: 'span', _key: `${text}-s`, text }], markDefs: [] });
const announcement = (messageZh: Announcement['messageZh'] = [block('投票將於週五結束')]): Announcement => ({
	id: 'rev1',
	message: [block('Voting closes Friday')],
	messageZh,
});

function renderBar(value: Announcement, language: LanguageCode = 'en') {
	return render(
		<LanguageProvider defaultTranslations={language === 'zh' ? zh : en} initialLanguage={language}>
			<AnnouncementBar announcement={value} />
		</LanguageProvider>
	);
}

beforeEach(() => {
	mockPathname = '/';
	document.cookie = 'announcement-dismissed=; path=/; max-age=0';
});

describe('AnnouncementBar', () => {
	it('shows the English message', () => {
		renderBar(announcement());
		expect(screen.getByRole('region', { name: 'Announcement' })).toHaveTextContent('Voting closes Friday');
	});

	it('shows the Chinese message to Chinese readers', () => {
		renderBar(announcement(), 'zh');
		const bar = screen.getByRole('region', { name: '公告' });
		expect(bar).toHaveTextContent('投票將於週五結束');
		expect(bar).not.toHaveTextContent('Voting closes Friday');
	});

	it('shows Chinese readers the English message when there is no Chinese one', () => {
		renderBar(announcement(null), 'zh');
		expect(screen.getByRole('region', { name: '公告' })).toHaveTextContent('Voting closes Friday');
	});

	it('hides once dismissed and remembers which announcement it was', async () => {
		renderBar(announcement());
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
		// It folds away first
		await waitFor(() => expect(screen.queryByRole('region', { name: 'Announcement' })).not.toBeInTheDocument());
		expect(document.cookie).toContain('announcement-dismissed=rev1');
	});

	it('stays off the login page', () => {
		mockPathname = '/login';
		renderBar(announcement());
		expect(screen.queryByRole('region', { name: 'Announcement' })).not.toBeInTheDocument();
	});
});
