'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { BotAvatar } from './BotAvatar';
import { BOT_FAMILIES, BOT_KINDS, type BotFamily, type BotKind, resolveAvatar } from './catalog';
import { chooseAvatar } from './service';

/** Settings card for choosing one of the cast as your avatar. */
export function AvatarPicker({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
	const { t } = useLanguage();
	// What everyone sees now; the parent remounts this when avatarUrl changes
	const [saved, setSaved] = useState<BotKind>(() => resolveAvatar(username, avatarUrl));
	const [selected, setSelected] = useState<BotKind>(saved);
	const [isSaving, setIsSaving] = useState(false);
	const unchanged = selected === saved;

	const surprise = () => {
		const others = BOT_KINDS.filter((kind) => kind !== selected);
		setSelected(others[Math.floor(Math.random() * others.length)]);
	};

	const save = async () => {
		setIsSaving(true);
		const result = await chooseAvatar(selected);
		setIsSaving(false);
		if (!result.ok) {
			toast.error(result.message);
			return;
		}
		setSaved(selected);
		toast.success(t('avatar.savedToast'));
	};

	return (
		<section aria-labelledby="avatar-title" className="space-y-3">
			<div>
				<h3 id="avatar-title" className="font-medium">
					{t('avatar.title')}
				</h3>
				<p className="text-sm text-muted-foreground">{t('avatar.body')}</p>
			</div>
			<div className="space-y-5 rounded-xl border border-border bg-card p-4 md:p-5">
				<div className="flex flex-wrap items-center gap-4">
					<BotAvatar kind={selected} className="size-20" tooltip={false} />
					<div className="min-w-0 flex-1" aria-live="polite">
						<p className="font-medium">{t(`avatar.bots.${selected}.name`)}</p>
						<p className="text-[13px] text-muted-foreground">{t(`avatar.bots.${selected}.trait`)}</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={surprise}>
							{t('avatar.surprise')}
						</Button>
						<Button onClick={save} disabled={unchanged || isSaving}>
							{isSaving && <Spinner className="mr-2" />}
							{t(unchanged ? 'avatar.saved' : 'avatar.save')}
						</Button>
					</div>
				</div>

				{(Object.keys(BOT_FAMILIES) as BotFamily[]).map((family) => (
					<div key={family} className="space-y-2">
						<p className="font-mono text-xs text-muted-foreground">{t(`avatar.families.${family}`)}</p>
						<div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
							{BOT_FAMILIES[family].map((kind) => (
								<button
									key={kind}
									type="button"
									aria-pressed={kind === selected}
									aria-label={t('avatar.choose', { name: t(`avatar.bots.${kind}.name`) })}
									onClick={() => setSelected(kind)}
									className={cn(
										'aspect-square rounded-full p-0.5 transition-shadow',
										kind === selected ? 'bg-foreground ring-4 ring-volt' : 'hover:bg-border-strong'
									)}
								>
									<BotAvatar kind={kind} className="size-full" />
								</button>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
