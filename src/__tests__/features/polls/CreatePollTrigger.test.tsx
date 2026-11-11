import { fireEvent, render, screen } from '@testing-library/react';

import { ActingProvider } from '@/features/communities/ActingProvider';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
const mockCreator = jest.fn();
jest.mock('@/features/polls/components/PollCreator', () => ({
	PollCreator: (props: { open: boolean; finalFocus?: unknown }) => {
		mockCreator(props);
		return props.open ? <div role="dialog">Creator</div> : null;
	},
}));

beforeEach(() => mockCreator.mockClear());

describe('CreatePollTrigger', () => {
	it('renders the trigger without mounting the creator', () => {
		render(
			<CreatePollTrigger>
				<button>Create poll</button>
			</CreatePollTrigger>
		);
		expect(screen.getByRole('button', { name: 'Create poll' })).toHaveAttribute('aria-haspopup', 'dialog');
		expect(mockCreator).not.toHaveBeenCalled();
	});

	it('opens the creator when the trigger is pressed', async () => {
		render(
			<CreatePollTrigger>
				<button>Create poll</button>
			</CreatePollTrigger>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Create poll' }));
		expect(await screen.findByRole('dialog')).toHaveTextContent('Creator');
	});

	it('marks the trigger expanded and returns focus to it on close', async () => {
		render(
			<CreatePollTrigger>
				<button>Create poll</button>
			</CreatePollTrigger>
		);
		const trigger = screen.getByRole('button', { name: 'Create poll' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		fireEvent.click(trigger);
		await screen.findByRole('dialog');
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(mockCreator).toHaveBeenLastCalledWith(
			expect.objectContaining({ finalFocus: { current: trigger } })
		);
	});

	it("keeps the trigger's own click handler", () => {
		const onClick = jest.fn();
		render(
			<CreatePollTrigger>
				<button onClick={onClick}>Create poll</button>
			</CreatePollTrigger>
		);
		fireEvent.click(screen.getByRole('button', { name: 'Create poll' }));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('leaves the button out while acting as a locked community account', () => {
		const acting = { communityId: 'c1', username: 'robotics', displayName: null, avatarUrl: null, role: 'OWNER' as const, locked: true };
		render(
			<ActingProvider state={{ acting, me: null, communities: [], stale: false }}>
				<CreatePollTrigger>
					<button>Create poll</button>
				</CreatePollTrigger>
			</ActingProvider>
		);
		expect(screen.queryByRole('button', { name: 'Create poll' })).not.toBeInTheDocument();
	});
});
