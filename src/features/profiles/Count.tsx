import { useLanguage } from '@/contexts/LanguageContext';
import { toPayloadLocale } from '@/lib/locale';

/**
 * A localized count phrase ("1,204 followers", "1,204 位追蹤者") with its number
 * set in mono ink, as every count on a profile is. `label` is the whole phrase.
 */
export function Count({ value, label }: { value: number; label: string }) {
	const { currentLanguage } = useLanguage();
	const number = value.toLocaleString(toPayloadLocale(currentLanguage));
	const at = label.indexOf(number);
	if (at < 0) return label;
	return (
		<>
			{label.slice(0, at)}
			<span className="tabular-nums text-foreground">{number}</span>
			{label.slice(at + number.length)}
		</>
	);
}
