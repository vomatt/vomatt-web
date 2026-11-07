import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

// ESLint bans the middle dot in source; translations are JSON, so this covers them (see DESIGN.md, Type)
it.each([
	['en', en],
	['zh', zh],
])('%s strings separate parts without a middle dot', (_, strings) => {
	expect(JSON.stringify(strings)).not.toContain(String.fromCharCode(0xb7));
});
