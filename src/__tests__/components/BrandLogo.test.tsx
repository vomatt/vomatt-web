import { render } from '@testing-library/react';

import BrandLogo from '@/components/BrandLogo';

describe('BrandLogo', () => {
	// The splash pulse in global.css staggers one delay per letter path
	it('draws each letter of vomatt as its own shape', () => {
		const { container } = render(<BrandLogo />);
		expect(container.querySelectorAll('svg > path')).toHaveLength('vomatt'.length);
	});
});
