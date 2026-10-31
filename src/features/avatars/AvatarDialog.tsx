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
import { Check, Pencil } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { cn } from '@/lib/utils';

import {
	type AvatarChoice,
	avatarCopyKey,
	BOT_FAMILIES,
	BOT_KINDS,
	type BotFamily,
	NO_BOT,
	resolveAvatar,
} from './catalog';
import { chooseAvatar } from './service';
import { ChosenAvatar } from './UserAvatar';

const TILE_GRID =
	'grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5 md:grid-cols-[repeat(auto-fill,minmax(72px,1fr))] md:gap-2';

/**
 * The owner's avatar, opening the cast to choose from. Size comes from `className`, as on `UserAvatar`.
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
	const [selected, setSelected] = useState<AvatarChoice>(saved);
	const [isSaving, setIsSaving] = useState(false);
	// Tile tooltips stay inside the scrolling grid, so they flip or shift rather than cover the header
	const [grid, setGrid] = useState<HTMLDivElement | null>(null);
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
		// Enabled even when unchanged, so it never drops focus; nothing to save just closes
		if (unchanged) {
			setOpen(false);
			return;
		}
		setIsSaving(true);
		try {
			const result = await chooseAvatar(selected);
			if (!result.ok) {
				toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
				return;
			}
			setOpen(false);
			toast.success(t('avatar.savedToast'));
		} catch {
			// The action itself returns failures; this is the request to it failing (e.g. offline)
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setIsSaving(false);
		}
	};

	const renderTile = (kind: AvatarChoice) => (
		<button
			key={kind}
			type="button"
			aria-pressed={kind === selected}
			aria-label={t('avatar.choose', { name: t(`${avatarCopyKey(kind)}.name`) })}
			onClick={() => setSelected(kind)}
			className={cn(
				'relative aspect-square rounded-full p-0.5 transition-shadow outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
				kind === selected
					? // Forced colors drop the ring; the outline survives as the selection
						'ring-2 ring-primary forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-solid'
					: 'hover:bg-border-strong'
			)}
		>
			<ChosenAvatar kind={kind} className="size-full" tooltip tooltipBoundary={grid} />
			{kind === selected && (
				<span
					aria-hidden
					className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-popover"
				>
					<Check size={12} />
				</span>
			)}
		</button>
	);

	return (
		<Dialog open={open} onOpenChange={openChange}>
			<DialogTrigger
				aria-label={t('avatar.change')}
				className="group relative shrink-0 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
			>
				<ChosenAvatar
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
					<ChosenAvatar
						kind={selected}
						className="size-16 md:size-28"
					/>
					<div className="min-w-0 flex-1" aria-live="polite">
						<p className="font-medium md:text-body-1">
							{t(`${avatarCopyKey(selected)}.name`)}
						</p>
						<p className="text-caption-2 text-muted-foreground">
							{t(`${avatarCopyKey(selected)}.trait`)}
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={surprise}>
						{t('avatar.surprise')}
					</Button>
				</div>

				<div ref={setGrid} className="-mx-4 space-y-5 overflow-y-auto overscroll-contain px-4 pb-1">
					{/* No character first, as its own group, then the cast */}
					<div className="space-y-2">
						<p className="text-caption-3 text-muted-foreground">{t('avatar.families.plain')}</p>
						<div className={TILE_GRID}>{renderTile(NO_BOT)}</div>
					</div>
					{(Object.keys(BOT_FAMILIES) as BotFamily[]).map((family) => (
						<div key={family} className="space-y-2">
							<p className="text-caption-3 text-muted-foreground">
								{t(`avatar.families.${family}`)}
							</p>
							<div className={TILE_GRID}>{BOT_FAMILIES[family].map(renderTile)}</div>
						</div>
					))}
				</div>

				<DialogFooter showCloseButton closeLabel={t('common.close')}>
					<Button onClick={save} loading={isSaving}>
						{t('avatar.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
