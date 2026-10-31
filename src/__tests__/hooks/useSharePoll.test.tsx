import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import { useSharePoll } from '@/features/polls/hooks/useSharePoll';
import { sharePoll } from '@/features/polls/service';

jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));
jest.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
jest.mock('@/features/polls/service', () => ({ sharePoll: jest.fn() }));

const poll = { id: 'poll-1', title: 'Which day?' };

afterEach(() => {
	jest.clearAllMocks();
	delete (navigator as { share?: unknown }).share;
});

describe('useSharePoll()', () => {
	it('counts a native share', async () => {
		Object.assign(navigator, { share: jest.fn().mockResolvedValue(undefined) });
		await renderHook(() => useSharePoll()).result.current(poll);
		expect(sharePoll).toHaveBeenCalledWith('poll-1', 'NATIVE');
	});

	it('does not count a dismissed share sheet', async () => {
		Object.assign(navigator, { share: jest.fn().mockRejectedValue(new DOMException('', 'AbortError')) });
		await renderHook(() => useSharePoll()).result.current(poll);
		expect(sharePoll).not.toHaveBeenCalled();
	});

	it('copies the link when the share sheet fails', async () => {
		const writeText = jest.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			share: jest.fn().mockRejectedValue(new DOMException('', 'NotAllowedError')),
			clipboard: { writeText },
		});
		await renderHook(() => useSharePoll()).result.current(poll);
		expect(writeText).toHaveBeenCalled();
		expect(sharePoll).toHaveBeenCalledWith('poll-1', 'COPY_LINK');
	});

	it('says so, and does not count it, when the link could not be copied', async () => {
		Object.assign(navigator, { clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denied')) } });
		await renderHook(() => useSharePoll()).result.current(poll);
		expect(toast.error).toHaveBeenCalledWith('poll.linkCopyFailed');
		expect(sharePoll).not.toHaveBeenCalled();
	});

	it('counts a copied link', async () => {
		Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
		await renderHook(() => useSharePoll()).result.current(poll);
		expect(sharePoll).toHaveBeenCalledWith('poll-1', 'COPY_LINK');
	});
});
