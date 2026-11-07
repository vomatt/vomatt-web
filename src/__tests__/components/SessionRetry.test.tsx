import { act, fireEvent, render, screen } from '@testing-library/react';

import { SessionRetry } from '@/components/SessionRetry';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

const loader = <span data-testid="loader" />;
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
		render(<SessionRetry loader={loader} />);
		expect(screen.getByRole('status')).toHaveTextContent('Signing you in');
	});

	it('shows the loader it is given, with no loading bar under it', () => {
		const { container } = render(<SessionRetry loader={loader} />);
		expect(screen.getByTestId('loader')).toBeInTheDocument();
		expect(container.querySelector('[data-slot="skeleton"]')).toBeNull();
	});

	it('renders the page once the proxy settles the session', async () => {
		probeAnswers(503, 503, 204);
		render(<SessionRetry loader={loader} />);

		await waitSeconds(60);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'x-session-probe': '1' });
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('keeps trying through network errors', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		probeAnswers(204);
		render(<SessionRetry loader={loader} />);

		await waitSeconds(10);

		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('keeps trying while a refresh leaves it in place, then gives up', async () => {
		probeAnswers(204, 204, 204);
		render(<SessionRetry loader={loader} />);

		await waitSeconds(60);

		expect(refresh).toHaveBeenCalledTimes(3);
		expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
	});

	it('after the last try, says so and offers another round', async () => {
		probeAnswers(503, 503, 503, 204);
		render(<SessionRetry loader={loader} />);
		await waitSeconds(60);

		expect(refresh).not.toHaveBeenCalled();
		expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toBeEmptyDOMElement();

		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		await waitSeconds(5);
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
