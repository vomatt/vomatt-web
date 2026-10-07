import { fireEvent, render, screen } from '@testing-library/react';

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
};

beforeEach(() => localStorage.clear());

describe('DraftList', () => {
	it('shows the empty state without drafts', () => {
		render(<DraftList />);
		expect(screen.getByText('No polls here yet.')).toBeInTheDocument();
	});

	it('lists drafts newest first, with a fallback title', () => {
		saveDraft({ ...values, title: 'Older' });
		saveDraft(values);
		render(<DraftList />);
		const items = screen.getAllByRole('listitem');
		expect(items[0]).toHaveTextContent('Untitled poll');
		expect(items[1]).toHaveTextContent('Older');
	});

	it('deletes a draft', () => {
		saveDraft({ ...values, title: 'Throwaway' });
		render(<DraftList />);
		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		expect(screen.queryByText('Throwaway')).not.toBeInTheDocument();
		expect(listDrafts()).toEqual([]);
	});
});
