'use client';

import { Button } from '@/components/ui/Button';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserChip } from '@/features/profiles/UserChip';

import { type Person, personKey } from '../invitees';

type PeopleListProps<P extends Person> = {
	label: string;
	people: P[];
	onRemove: (person: P) => void;
	/** The `personKey` of the one being removed. */
	removingKey: string | null;
	disabled: boolean;
	/** Shown instead of the remove button for someone who can't be removed. */
	noteFor?: (person: P) => string | null;
};

/** Invitees or Group members, each listed by username or by the email they were added by. */
export function PeopleList<P extends Person>({
	label,
	people,
	onRemove,
	removingKey,
	disabled,
	noteFor,
}: PeopleListProps<P>) {
	const { t } = useLanguage();
	return (
		<ul aria-label={label} className="space-y-1">
			{people.map((person) => {
				const key = personKey(person);
				const name = person.username ?? person.email ?? '';
				const note = noteFor?.(person);
				return (
					<li key={key} className="flex min-h-11 items-center gap-3 text-body-4">
						{person.username ? (
							<UserChip
								username={person.username}
								avatarUrl={person.avatarUrl}
								className="flex-1 gap-3"
							/>
						) : (
							<>
								<InitialAvatar name={name} />
								<span className="min-w-0 flex-1 truncate">{name}</span>
							</>
						)}
						{note ? (
							<span className="text-caption-2 text-muted-foreground">{note}</span>
						) : (
							<Button
								variant="ghost"
								size="icon"
								aria-label={t('invitees.remove', { name })}
								disabled={disabled}
								loading={removingKey === key}
								onClick={() => onRemove(person)}
								className="text-muted-foreground hover:text-destructive"
							>
								<X className="size-4" />
							</Button>
						)}
					</li>
				);
			})}
		</ul>
	);
}
