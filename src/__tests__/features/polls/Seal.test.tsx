import { render, screen } from '@testing-library/react';

import { Seal, SealMark } from '@/features/polls/components/Seal';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

describe('SealMark', () => {
	it('draws a 32px ring without the dashed inner ring for profile rows and notifications', () => {
		const { container } = render(<SealMark />);
		expect(container.firstChild).toHaveClass('size-8');
		expect(container.querySelector('.border-dashed')).toBeNull();
	});

	it('draws a 40px ring with the dashed inner ring for the Seal row', () => {
		const { container } = render(<SealMark size="md" />);
		expect(container.firstChild).toHaveClass('size-10');
		expect(container.querySelector('.border-dashed')).not.toBeNull();
	});

	it('draws the 72px ring with the dashed inner ring for the Seal moment', () => {
		const { container } = render(<SealMark size="lg" />);
		expect(container.firstChild).toHaveClass('size-[72px]');
		expect(container.querySelector('.border-dashed')).not.toBeNull();
	});
});

describe('Seal', () => {
	it.each(['moment', 'row'] as const)('as a %s, thanks the voter and says when the results open', (variant) => {
		render(
			<Seal variant={variant} endTime={iso(3 * HOUR)}>
				<button type="button">Withdraw vote</button>
			</Seal>
		);
		expect(screen.getByText('Sealed. Thank you.')).toBeInTheDocument();
		expect(screen.getByText(/^Results are sealed until .+\. We’ll notify you when they’re in\.$/)).toBeInTheDocument();
		expect(screen.getByText('Pick another option to change your vote.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Withdraw vote' })).toBeInTheDocument();
	});

	it('says the results open at the end for a Poll without an end time', () => {
		render(<Seal variant="row" endTime={null}>{null}</Seal>);
		expect(
			screen.getByText('Results are sealed until the poll ends. We’ll notify you when they’re in.')
		).toBeInTheDocument();
	});

	it('says neither who sees the choice nor the turnout', () => {
		render(<Seal variant="moment" endTime={iso(3 * HOUR)}>{null}</Seal>);
		expect(screen.queryByText(/can see what you chose/)).not.toBeInTheDocument();
		expect(screen.queryByText(/voted/)).not.toBeInTheDocument();
	});
});
