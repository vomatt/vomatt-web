import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DraftList } from '@/features/polls/components/DraftList';
import { listDrafts, saveDraft } from '@/features/polls/drafts';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/features/polls/service', () => ({}));

const values = {
	title: '',
	description: '',
	options: [{ text: '' }, { text: '' }],
	startTime: '',
	endTime: '',
	voterVisibility: 'owner' as const,
	audience: 'public' as const,
	invitees: { users: [], emails: [], groups: [] },
};

beforeEach(() => localStorage.clear());

describe('DraftList', () => {
	it('shows the given empty state without drafts', () => {
		render(<DraftList empty={<p>Nothing saved</p>} />);
		expect(screen.getByText('Nothing saved')).toBeInTheDocument();
	});

	it('heads the rows with their count', () => {
		saveDraft(values);
		render(<DraftList header={(count) => <h3>Drafts · {count}</h3>} />);
		expect(screen.getByRole('heading', { name: 'Drafts · 1' })).toBeInTheDocument();
	});

	it('lists drafts newest first, with a fallback title', () => {
		saveDraft({ ...values, title: 'Older', options: [{ text: 'Yes' }, { text: 'No' }] });
		saveDraft(values);
		render(<DraftList />);
		const items = screen.getAllByRole('listitem');
		expect(items[1]).toHaveTextContent('2 options');
		expect(items[0]).toHaveTextContent('Untitled poll');
		expect(items[1]).toHaveTextContent('Older');
	});

	describe('meta', () => {
		// Wed 28 Oct 2026 10:00 in Taipei, where Jest runs
		beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-28T02:00:00Z')));
		afterEach(() => jest.restoreAllMocks());

		const store = (draft: { savedAt: string; values: typeof values }) =>
			localStorage.setItem('vomatt_poll_drafts', JSON.stringify([{ id: 'd1', ...draft }]));

		it('says when it was saved, its filled options and a missing end', () => {
			store({
				savedAt: '2026-10-27T09:00:00Z',
				values: { ...values, title: 'Rename the club?', options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: ' ' }] },
			});
			render(<DraftList />);
			expect(screen.getByText('Saved yesterday · 3 options · no end date yet')).toBeInTheDocument();
		});

		it('says only when a blank draft with an end was saved', () => {
			store({ savedAt: '2026-10-20T09:00:00Z', values: { ...values, endTime: '2026-11-01T20:00' } });
			render(<DraftList />);
			expect(screen.getByText('Saved Oct 20')).toBeInTheDocument();
		});
	});

	it('deletes a draft from its menu', async () => {
		saveDraft({ ...values, title: 'Throwaway' });
		render(<DraftList />);
		await userEvent.click(screen.getByRole('button', { name: /More for Throwaway/ }));
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
		expect(screen.queryByText('Throwaway')).not.toBeInTheDocument();
		expect(listDrafts()).toEqual([]);
	});

	it('fills in the Audience of a draft saved before it existed', () => {
		const { audience: _audience, invitees: _invitees, ...old } = values;
		localStorage.setItem('vomatt_poll_drafts', JSON.stringify([{ id: 'd1', savedAt: '', values: old }]));
		expect(listDrafts()[0].values).toMatchObject({ audience: 'public', invitees: { users: [] } });
	});

	it('skips a malformed draft instead of hiding them all', () => {
		localStorage.setItem(
			'vomatt_poll_drafts',
			JSON.stringify([{ id: 'd1', savedAt: '', values }, { id: 'd2', savedAt: '' }])
		);
		expect(listDrafts().map((draft) => draft.id)).toEqual(['d1']);
	});
});
