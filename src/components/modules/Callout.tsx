import { type ActionsModuleData, ModuleActions, ModuleSection } from './shared';

/** A card asking for one next step, usually closing a page. */
export default function Callout({ data }: { data: ActionsModuleData }) {
	const { actions, ...heading } = data;

	return (
		<ModuleSection {...heading} className="gap-5 rounded-2xl border border-border bg-card p-6 md:p-8">
			<ModuleActions actions={actions} />
		</ModuleSection>
	);
}
