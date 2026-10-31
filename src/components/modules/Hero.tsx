import { type ActionsModuleData, Eyebrow, ModuleActions } from './shared';

/** The page's opening and, when it has a heading, its h1. */
export default function Hero({ data }: { data: ActionsModuleData }) {
	const { eyebrow, heading, intro, actions } = data;

	return (
		<header className="flex flex-col gap-4">
			<Eyebrow>{eyebrow}</Eyebrow>
			{heading && (
				<h1 className="text-display-2 text-foreground md:text-display-1">{heading}</h1>
			)}
			{intro && <p className="text-body-1 leading-relaxed text-muted-foreground">{intro}</p>}
			<ModuleActions actions={actions} className="pt-2" />
		</header>
	);
}
