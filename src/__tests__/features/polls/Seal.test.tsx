import { render, screen } from '@testing-library/react';

import { Seal, SealMark } from '@/features/polls/components/Seal';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

describe('SealMark', () => {
	it('draws a 32px ring without the dashed inner ring for rows', () => {
		const { container } = render(<SealMark />);
		expect(container.firstChild).toHaveClass('size-8');
		expect(container.querySelector('.border-dashed')).toBeNull();
	});

	it('draws the 72px ring with the dashed inner ring for the full Seal', () => {
		const { container } = render(<SealMark size="lg" />);
		expect(container.firstChild).toHaveClass('size-[72px]');
		expect(container.querySelector('.border-dashed')).not.toBeNull();
	});
});

describe('Seal', () => {
	it('says in a row when the results open, without who sees the choice', () => {
		render(<Seal full={false} endTime={iso(3 * HOUR)} visibility="owner" />);
		expect(screen.getByText('Sealed.')).toBeInTheDocument();
		expect(screen.getByText(/^Results open .+\. We’ll notify you\.$/)).toBeInTheDocument();
		expect(screen.queryByText(/poll owner/)).not.toBeInTheDocument();
	});

	it('says the results open at the end for a Poll without an end time', () => {
		render(<Seal full={false} endTime={null} visibility="owner" />);
		expect(screen.getByText('Results open when the poll ends. We’ll notify you.')).toBeInTheDocument();
	});

	it('in full, thanks the voter and says who sees the choice and the turnout', () => {
		render(<Seal full endTime={iso(3 * HOUR)} visibility="nobody" turnout={1284} />);
		expect(screen.getByText('Sealed. Thank you.')).toBeInTheDocument();
		expect(screen.getByText(/^Results are sealed until .+\. We’ll notify you when they’re in\.$/)).toBeInTheDocument();
		expect(screen.getByText('After it ends, no one can see what you chose.')).toBeInTheDocument();
		expect(screen.getByText('1,284 voted, you included')).toBeInTheDocument();
	});
});
