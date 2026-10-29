import { type ActionsModuleData, Eyebrow, ModuleActions } from './shared';

/** The page's opening and, when it has a heading, its h1. */
export default function Hero({ data }: { data: ActionsModuleData }) {
	const { eyebrow, heading, intro, actions } = data;

	return (
		<header className="flex flex-col gap-4">
			<Eyebrow>{eyebrow}</Eyebrow>
			{heading && (
				<h1 className="display-heading text-[36px] leading-[1.1] text-foreground md:text-[48px]">{heading}</h1>
			)}
			{intro && <p className="text-[17px] leading-[1.6] text-muted-foreground md:text-lg">{intro}</p>}
			<ModuleActions actions={actions} className="pt-2" />
		</header>
	);
}
