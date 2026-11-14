import { render, screen } from '@testing-library/react';

import { Seal, SealMark } from '@/features/polls/components/Seal';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

// False stands in for the server render and hydration
let mockHydrated = true;
jest.mock('@/hooks/useHydrated', () => ({ useHydrated: () => mockHydrated }));
afterEach(() => {
	mockHydrated = true;
});

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

describe('SealMark', () => {
	it('draws a 32px ring without the dashed inner ring for profile rows and notifications', () => {
		const { container } = render(<SealMark />);
		expect(container.firstChild).toHaveClass('size-8');
		expect(container.querySelector('.border-dashed')).toBeNull();
	});

	it('draws the dashed inner ring for the Seal, 32px on phones and 40px from md', () => {
		const { container } = render(<SealMark size="md" />);
		expect(container.firstChild).toHaveClass('size-8', 'md:size-10');
		expect(container.querySelector('.border-dashed')).not.toBeNull();
	});
});

describe('Seal', () => {
	it('says when the results open and how to change the vote', () => {
		render(
			<Seal endTime={iso(3 * HOUR)}>
				<button type="button">Withdraw vote</button>
			</Seal>
		);
		expect(screen.getByText(/^Sealed until (?!the poll ends).+$/)).toBeInTheDocument();
		expect(screen.getByText('Pick another option to change your vote.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Withdraw vote' })).toBeInTheDocument();
	});

	it('says the vote is sealed before the viewer clock is known, with no blank title', () => {
		mockHydrated = false;
		render(<Seal endTime={iso(3 * HOUR)}>{null}</Seal>);
		expect(screen.getByText('Sealed')).toBeVisible();
		expect(screen.queryByText(/^Sealed until /)).not.toBeInTheDocument();
	});

	it('says the results open at the end for a Poll without an end time', () => {
		render(<Seal endTime={null}>{null}</Seal>);
		expect(screen.getByText('Sealed until the poll ends')).toBeInTheDocument();
	});

	it('says neither who sees the choice nor the turnout', () => {
		render(<Seal endTime={iso(3 * HOUR)}>{null}</Seal>);
		expect(screen.queryByText(/can see what you chose/)).not.toBeInTheDocument();
		expect(screen.queryByText(/voted/)).not.toBeInTheDocument();
	});
});
