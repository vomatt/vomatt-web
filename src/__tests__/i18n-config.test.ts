import { htmlLang } from '@/i18n-config';

describe('htmlLang', () => {
	it('tags Chinese as Traditional (zh-TW)', () => {
		expect(htmlLang('zh')).toBe('zh-TW');
	});

	it('leaves English as is', () => {
		expect(htmlLang('en')).toBe('en');
	});
});
