import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { encode } from 'uqr';

import { PollQrDialog } from '@/features/polls/components/PollQrDialog';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));
jest.mock('@/features/polls/service', () => ({ sharePoll: jest.fn() }));

describe('PollQrDialog', () => {
	const qr = () => {
		render(<PollQrDialog pollId="poll-1" title="Market night?" open onOpenChange={jest.fn()} />);
		return screen.getByRole('img', { name: 'QR code for this poll’s link' });
	};

	it('draws black modules on a white tile whatever the theme', () => {
		const image = qr();
		expect(image.querySelector('rect')).toHaveAttribute('fill', '#fff');
		expect(image.querySelector('path')).toHaveAttribute('fill', '#000');
	});

	it("encodes the poll's link with a four-module quiet zone", () => {
		const modules = encode('http://localhost/poll/poll-1', { border: 0 }).size;
		expect(qr()).toHaveAttribute('viewBox', `0 0 ${modules + 8} ${modules + 8}`);
		// The first dark module is the finder's corner, four modules in from the top and left
		expect(qr().querySelector('path')!.getAttribute('d')).toMatch(/^M4 4h/);
	});

	it('says the link could not be copied where the browser has no Clipboard API', async () => {
		Object.assign(navigator, { clipboard: undefined });
		qr();
		fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
		expect(toast).not.toHaveBeenCalled();
	});
});
