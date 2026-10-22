import { useLanguage as mockLanguage } from '@/__tests__/helpers/mockLanguage';
import { apiErrorText } from '@/lib/api/error-text';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

const { t } = mockLanguage();

describe('apiErrorText', () => {
	it("shows our copy of a known errorCode, not the API's message", () => {
		expect(apiErrorText(t, { errorCode: 'vote.not_found', message: 'raw' })).toBe('Vote not found');
	});

	it("keeps the API's filled-in message for a code with a {0} placeholder", () => {
		const failure = { errorCode: 'invite_list.max_reached', message: 'You can keep at most 50 Groups' };
		expect(apiErrorText(t, failure)).toBe('You can keep at most 50 Groups');
	});

	it("falls back to the API's message for an unknown errorCode", () => {
		expect(apiErrorText(t, { errorCode: 'vote.brand_new', message: 'Localized text' })).toBe('Localized text');
	});

	it('uses the fallback key when there is no errorCode', () => {
		const failure = { message: 'Request failed with status 502' };
		expect(apiErrorText(t, failure, 'groups.saveFailed')).toBe(en.groups.saveFailed);
	});

	it("keeps the API's detailed message for a validation failure", () => {
		const failure = { errorCode: 'common.validation_failed', message: 'title: must not be blank' };
		expect(apiErrorText(t, failure)).toBe('title: must not be blank');
	});

	it('uses common.busy for a conflict', () => {
		expect(apiErrorText(t, { errorCode: 'common.conflict', message: 'raw' })).toBe(en.common.busy);
	});

	it('defaults the fallback to common.error', () => {
		expect(apiErrorText(t, { message: '' })).toBe(en.common.error);
	});
});

describe('apiError locale strings', () => {
	const leaves = (node: object, prefix = ''): string[] =>
		Object.entries(node).flatMap(([key, value]) =>
			typeof value === 'string' ? [`${prefix}${key}`] : leaves(value, `${prefix}${key}.`)
		);

	it('has the same codes in en and zh', () => {
		expect(leaves(zh.apiError)).toEqual(leaves(en.apiError));
	});
});
