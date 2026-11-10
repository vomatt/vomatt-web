'use client';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

import type { OfficialRole } from './schema';

/** Toggle pills of the roles on offer, the chosen one's meaning on the line under them. */
export function RolePicker({
	roles,
	value,
	onChange,
}: {
	roles: readonly OfficialRole[];
	value: OfficialRole;
	onChange: (role: OfficialRole) => void;
}) {
	const { t } = useLanguage();
	return (
		<fieldset className="space-y-2">
			<legend className="mb-2 text-caption-2 font-medium text-muted-foreground">{t('officials.role')}</legend>
			<div className="flex flex-wrap gap-2">
				{roles.map((role) => (
					<Button
						key={role}
						type="button"
						size="sm"
						variant={role === value ? 'default' : 'outline'}
						aria-pressed={role === value}
						className="rounded-full"
						onClick={() => onChange(role)}
					>
						{t(`officials.roles.${role}`)}
					</Button>
				))}
			</div>
			<p className="text-caption-1 text-muted-foreground">{t(`officials.roleBodies.${value}`)}</p>
		</fieldset>
	);
}
