import { useState } from 'react';

/**
 * Which switches are saving, so each allows one save at a time and the server can't apply an older
 * toggle after a newer one.
 */
export function useSavingKeys<K>() {
	const [saving, setSaving] = useState<ReadonlySet<K>>(new Set());
	const setSavingKey = (key: K, on: boolean) =>
		setSaving((current) => {
			const next = new Set(current);
			if (on) next.add(key);
			else next.delete(key);
			return next;
		});
	return [saving, setSavingKey] as const;
}
