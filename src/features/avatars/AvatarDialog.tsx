'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { Pencil } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { BotAvatar } from './BotAvatar';
import {
	BOT_FAMILIES,
	BOT_KINDS,
	type BotFamily,
	type BotKind,
	resolveAvatar,
} from './catalog';
import { chooseAvatar } from './service';

/**
 * The owner's avatar as a button that opens the cast to choose from.
 * Size comes from `className`, as on `UserAvatar`.
 */
export function AvatarDialog({
	username,
	avatarUrl,
	className,
}: {
	username: string;
	avatarUrl: string | null;
	className?: string;
}) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	// What everyone sees now; saving refreshes the page, which passes the new avatarUrl
	const saved = resolveAvatar(username, avatarUrl);
	const [selected, setSelected] = useState<BotKind>(saved);
	const [isSaving, setIsSaving] = useState(false);
	const unchanged = selected === saved;

	const openChange = (next: boolean) => {
		// Each visit starts from the saved bot, not an abandoned pick
		if (next) setSelected(saved);
		setOpen(next);
	};

	const surprise = () => {
		const others = BOT_KINDS.filter((kind) => kind !== selected);
		setSelected(others[Math.floor(Math.random() * others.length)]);
	};

	const save = async () => {
		setIsSaving(true);
		try {
			const result = await chooseAvatar(selected);
			if (!result.ok) {
				toast.error(result.message);
				return;
			}
			setOpen(false);
			toast.success(t('avatar.savedToast'));
		} catch {
			// The action itself returns failures; this is the request to it failing (e.g. offline)
			toast.error(t('account.saveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={openChange}>
			<DialogTrigger
				aria-label={t('avatar.change')}
				className="group relative shrink-0 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
			>
				<BotAvatar
					kind={saved}
					className={cn('transition-opacity group-hover:opacity-80', className)}
				/>
				<span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-card text-foreground">
					<Pencil size={12} aria-hidden />
				</span>
			</DialogTrigger>
			<DialogContent
				closeLabel={t('common.close')}
				className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] sm:max-w-md md:max-w-2xl"
			>
				<DialogHeader>
					<DialogTitle>{t('avatar.title')}</DialogTitle>
					<DialogDescription>{t('avatar.body')}</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-4">
					<BotAvatar
						kind={selected}
						className="size-16 md:size-28"
					/>
					<div className="min-w-0 flex-1" aria-live="polite">
						<p className="font-medium md:text-lg">
							{t(`avatar.bots.${selected}.name`)}
						</p>
						<p className="text-[13px] text-muted-foreground">
							{t(`avatar.bots.${selected}.trait`)}
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={surprise}>
						{t('avatar.surprise')}
					</Button>
				</div>

				<div className="-mx-4 space-y-5 overflow-y-auto px-4 pb-1">
					{(Object.keys(BOT_FAMILIES) as BotFamily[]).map((family) => (
						<div key={family} className="space-y-2">
							<p className="font-mono text-xs text-muted-foreground">
								{t(`avatar.families.${family}`)}
							</p>
							<div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5 md:grid-cols-[repeat(auto-fill,minmax(72px,1fr))] md:gap-2">
								{BOT_FAMILIES[family].map((kind) => (
									<button
										key={kind}
										type="button"
										aria-pressed={kind === selected}
										aria-label={t('avatar.choose', {
											name: t(`avatar.bots.${kind}.name`),
										})}
										onClick={() => setSelected(kind)}
										className={cn(
											'aspect-square rounded-full p-0.5 transition-shadow',
											kind === selected
												? 'bg-foreground ring-4 ring-volt'
												: 'hover:bg-border-strong'
										)}
									>
										<BotAvatar kind={kind} className="size-full" tooltip />
									</button>
								))}
							</div>
						</div>
					))}
				</div>

				<DialogFooter showCloseButton closeLabel={t('common.close')}>
					<Button onClick={save} disabled={unchanged || isSaving}>
						{isSaving && <Spinner className="mr-2" />}
						{t('avatar.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
