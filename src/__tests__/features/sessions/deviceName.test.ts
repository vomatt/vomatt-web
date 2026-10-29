import { deviceName } from '@/features/sessions/deviceName';

describe('deviceName', () => {
	it('names the browser and system', () => {
		expect(
			deviceName(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
			)
		).toBe('Chrome · Mac');
		expect(
			deviceName(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
			)
		).toBe('Safari · iPhone');
	});

	it('is null when there is nothing to go on', () => {
		expect(deviceName(null)).toBeNull();
		expect(deviceName('okhttp/4.12')).toBeNull();
	});
});
