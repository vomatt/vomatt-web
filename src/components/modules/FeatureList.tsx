import {
	Bell,
	Check,
	Clock,
	Eye,
	Globe,
	Link2,
	Lock,
	MessageSquare,
	Plus,
	Search,
	Share2,
	Star,
	TrendingUp,
	Users,
} from '@/components/ui/SvgIcons';
import { TideRule, TideRules } from '@/components/ui/TidePanel';

import { ModuleSection, type SectionHeadingData } from './shared';

// The names vomatt-admin's feature-list schema offers; change both
const ICONS = {
	lock: Lock,
	users: Users,
	clock: Clock,
	eye: Eye,
	message: MessageSquare,
	bell: Bell,
	check: Check,
	globe: Globe,
	share: Share2,
	link: Link2,
	search: Search,
	plus: Plus,
	star: Star,
	trendingUp: TrendingUp,
};

type Feature = { _key: string; icon?: string; title?: string; body?: string };

export type FeatureListData = SectionHeadingData & {
	layout?: 'cards' | 'steps' | 'rules';
	items?: Feature[];
};

function iconFor(name?: string) {
	return ICONS[name as keyof typeof ICONS] ?? Check;
}

/** Short items as cards, numbered steps, or the rules on Tide (what vomatt promises). */
export default function FeatureList({ data }: { data: FeatureListData }) {
	const { eyebrow, heading, intro, layout = 'cards', items = [] } = data;

	return (
		<ModuleSection eyebrow={eyebrow} heading={heading} intro={intro}>
			{layout === 'rules' && (
				<TideRules className="space-y-4 p-5 text-[15px]">
					{items.map((item) => (
						<TideRule key={item._key} icon={iconFor(item.icon)}>
							<span className="block font-medium">{item.title}</span>
							{item.body}
						</TideRule>
					))}
				</TideRules>
			)}

			{layout === 'steps' && (
				<ol className="flex flex-col gap-5">
					{items.map((item, i) => (
						<li key={item._key} className="flex gap-4">
							<span
								aria-hidden
								className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card font-mono text-[13px] tabular-nums text-foreground"
							>
								{i + 1}
							</span>
							<div className="flex min-w-0 flex-col gap-1 pt-1">
								<h3 className="item-title leading-[1.4] text-foreground">{item.title}</h3>
								{item.body && <p className="text-[15px] leading-[1.6] text-muted-foreground">{item.body}</p>}
							</div>
						</li>
					))}
				</ol>
			)}

			{layout === 'cards' && (
				<ul className="grid gap-3 sm:grid-cols-2">
					{items.map((item) => {
						const Icon = iconFor(item.icon);
						return (
							<li
								key={item._key}
								className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-[18px]"
							>
								<span className="grid size-9 place-items-center rounded-full bg-field text-foreground">
									<Icon aria-hidden className="size-4" />
								</span>
								<h3 className="item-title leading-[1.4] text-foreground">{item.title}</h3>
								{item.body && <p className="text-[14px] leading-[1.55] text-muted-foreground">{item.body}</p>}
							</li>
						);
					})}
				</ul>
			)}
		</ModuleSection>
	);
}
