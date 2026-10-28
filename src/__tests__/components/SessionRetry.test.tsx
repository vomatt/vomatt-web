import { act, fireEvent, render, screen } from '@testing-library/react';

import { SessionRetry } from '@/components/SessionRetry';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

const fetchMock = jest.fn();
beforeEach(() => {
	jest.useFakeTimers();
	refresh.mockReset();
	fetchMock.mockReset();
	global.fetch = fetchMock;
});
afterEach(() => jest.useRealTimers());

const probeAnswers = (...statuses: number[]) => {
	for (const status of statuses) fetchMock.mockResolvedValueOnce({ status });
};

/** Each try is scheduled after the last one settles, so time passes a step at a time. */
async function waitSeconds(seconds: number) {
	for (let i = 0; i < seconds; i++) await act(async () => jest.advanceTimersByTime(1000));
}

describe('SessionRetry', () => {
	it('says it is signing in', () => {
		render(<SessionRetry />);
		expect(screen.getByRole('status')).toHaveTextContent('Signing you in');
	});

	it('renders the page once the proxy settles the session', async () => {
		probeAnswers(503, 503, 204);
		render(<SessionRetry />);

		await waitSeconds(60);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'x-session-probe': '1' });
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('keeps trying through network errors', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		probeAnswers(204);
		render(<SessionRetry />);

		await waitSeconds(10);

		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('after the last try, says so and offers another round', async () => {
		probeAnswers(503, 503, 503, 204);
		render(<SessionRetry />);
		await waitSeconds(60);

		expect(refresh).not.toHaveBeenCalled();
		expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();

		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		await waitSeconds(5);
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
