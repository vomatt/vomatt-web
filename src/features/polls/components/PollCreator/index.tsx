'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	AnimatePresence,
	m,
	useIsPresent,
	useReducedMotion,
} from 'motion/react';
import { useRouter } from 'next/navigation';
import {
	type FormEvent,
	type KeyboardEvent,
	ReactElement,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { FieldMessage } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Eye, Lock, Plus, User, Users, X } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { TideRule, TideRules } from '@/components/ui/TidePanel';
import { ENTER, EXIT, Unfold } from '@/components/Unfold';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';

import { deleteDraft, type PollDraft, saveDraft } from '../../drafts';
import { joinSentences } from '../../format';
import {
	AudienceSchema,
	type Poll,
	POLL_OPTION_MAX,
	POLL_OPTIONS_LIMIT,
	POLL_OPTIONS_MIN,
	POLL_TITLE_MAX,
	type VoterVisibility,
} from '../../schema';
import { createPoll, updatePoll } from '../../service';
import {
	derivePollStatus,
	type PollStatus,
	visibilityLevel,
} from '../../status';
import { BallotMark } from '../BallotMotion';
import { InviteePicker } from '../InviteePicker';
import { StatusChip } from '../StatusChip';
import {
	emptyPollForm,
	formToInput,
	pollFormSchema,
	type PollFormValues,
	pollToForm,
	toDateTimeInput,
	toSingleLine,
} from './formSchema';

const HOUR = 3600_000;
const END_PRESETS = [
	{ key: '1h', label: 'pollCreator.preset1h', ms: HOUR },
	{ key: '24h', label: 'pollCreator.preset24h', ms: 24 * HOUR },
	{ key: '3d', label: 'pollCreator.preset3d', ms: 3 * 24 * HOUR },
	{ key: '1w', label: 'pollCreator.preset1w', ms: 7 * 24 * HOUR },
] as const;
const VISIBILITY_ORDER: VoterVisibility[] = ['owner', 'signed-in', 'nobody'];
/** The write step's field labels and legends. */
const LABEL = 'text-body-4 leading-snug font-medium';

/** Writing and review slide toward where the step goes: forward to the left, back to the right. */
const STEP_VARIANTS = {
	enter: (direction: number) => ({
		opacity: 0,
		x: direction * 16,
		filter: 'blur(4px)',
	}),
	center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: ENTER },
	exit: (direction: number) => ({
		opacity: 0,
		x: direction * -16,
		filter: 'blur(4px)',
		transition: EXIT,
	}),
};
/** Under reduced motion the steps only cross-fade. */
const STEP_FADE = {
	enter: { opacity: 0 },
	center: { opacity: 1, transition: ENTER },
	exit: { opacity: 0, transition: EXIT },
};

/**
 * One step's content. While it is the current step it reports its height, so the dialog can grow
 * or shrink to it; while it leaves it is inert, since it is laid over the step that replaced it.
 */
function StepLayer({
	step,
	onResize,
	children,
}: {
	step: string;
	onResize: (step: string, height: number) => void;
	children: ReactNode;
}) {
	const isPresent = useIsPresent();
	const ref = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		const element = ref.current;
		if (!isPresent || !element) return;
		// Unrounded: an offsetHeight short of the content would leave the scroller a sub-pixel overflow
		const observer = new ResizeObserver(() =>
			onResize(step, element.getBoundingClientRect().height)
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [isPresent, onResize, step]);
	return (
		<div ref={ref} inert={!isPresent} className="space-y-4 p-4 sm:px-5">
			{children}
		</div>
	);
}

/**
 * Write everything on one screen, then review it the way voters will see it.
 * Status and times are fixed when entering review; a Closing chip still counts down.
 */
type ReviewSnapshot = {
	status: PollStatus;
	startTime: string;
	endTime: string;
};

export interface PollCreatorProps {
	/** A single button element; it becomes the dialog trigger. */
	triggerChildren?: ReactElement;
	/** Edit this Scheduled Poll and save it with PUT. */
	poll?: Poll;
	/** Resume a saved draft. */
	draft?: PollDraft;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSaved?: () => void;
	/** Where focus returns on close when the creator has no trigger of its own. */
	finalFocus?: RefObject<HTMLElement | null>;
}

function initialValues(poll?: Poll, draft?: PollDraft) {
	if (poll) return pollToForm(poll);
	return draft?.values ?? emptyPollForm();
}

/** Return alone: not Cmd/Ctrl+Return (submits), not Return that commits IME text. */
function isPlainReturn(e: KeyboardEvent) {
	return (
		e.key === 'Enter' &&
		!e.metaKey &&
		!e.ctrlKey &&
		!e.nativeEvent.isComposing &&
		e.keyCode !== 229
	);
}

/**
 * Focus another field right away. react-hook-form's setFocus waits a tick,
 * so keys typed in between would land in the field being left.
 */
function focusField(
	e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	name: string
) {
	const field = e.currentTarget.form?.elements.namedItem(name);
	if (field instanceof HTMLElement) field.focus();
}

/** A `datetime-local` value as ISO, or null when empty or unparseable. */
function localToIso(value: string) {
	const time = Date.parse(value);
	return value && !Number.isNaN(time) ? new Date(time).toISOString() : null;
}

export function PollCreator({
	triggerChildren,
	poll,
	draft,
	open: openProp,
	onOpenChange,
	onSaved,
	finalFocus,
}: PollCreatorProps) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const isEdit = !!poll;
	const [internalOpen, setInternalOpen] = useState(false);
	const open = openProp ?? internalOpen;
	// Built once: they read the clock, and useForm only needs the first value
	const [defaults] = useState(() => initialValues(poll, draft));
	const initialPreset = isEdit || draft ? null : '3d';
	// null while writing
	const [review, setReview] = useState<ReviewSnapshot | null>(null);
	const [showContext, setShowContext] = useState(!!defaults.description);
	// null is Custom: the end (and opening) times are typed in
	const [endPreset, setEndPreset] = useState<string | null>(initialPreset);
	const [showSaveDraftAlert, setShowSaveDraftAlert] = useState(false);

	const {
		register,
		control,
		handleSubmit,
		reset,
		getValues,
		getFieldState,
		setValue,
		setError,
		setFocus,
		clearErrors,
		formState: { errors, isDirty, isSubmitted, isSubmitting },
	} = useForm({
		resolver: zodResolver(pollFormSchema),
		defaultValues: defaults,
	});
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'options',
	});
	const [title, description, options, startTime, voterVisibility, audience] =
		useWatch({
			control,
			name: [
				'title',
				'description',
				'options',
				'startTime',
				'voterVisibility',
				'audience',
			],
		});
	const isInviteOnly = audience === 'invite-only';
	const titleRef = useRef<HTMLHeadingElement>(null);
	const reduceMotion = useReducedMotion();
	// The scroller follows the current step's height: animated when the step changes, at once
	// as the step itself grows (a section unfolding animates on its own)
	const [stepHeight, setStepHeight] = useState<{
		height: number;
		animate: boolean;
	}>();
	const measuredStep = useRef<string>(undefined);
	const onStepResize = useCallback((step: string, height: number) => {
		setStepHeight({
			height,
			animate:
				measuredStep.current !== undefined && measuredStep.current !== step,
		});
		measuredStep.current = step;
	}, []);

	// The write form unmounts on review; land on the step title so it is announced
	useEffect(() => {
		if (review) titleRef.current?.focus();
	}, [review]);
	const level = visibilityLevel({ voterVisibility, audience });

	const setOpen = (value: boolean) => {
		setInternalOpen(value);
		onOpenChange?.(value);
	};

	const close = () => {
		const values = initialValues(poll, draft);
		reset(values);
		setReview(null);
		setShowContext(!!values.description);
		setEndPreset(initialPreset);
		setOpen(false);
	};

	// Warn before the browser closes or refreshes with unsaved changes
	useEffect(() => {
		if (!open || !isDirty) return;
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [open, isDirty]);

	const handleOpenChange = (value: boolean) => {
		if (value) setOpen(true);
		else if (isDirty) setShowSaveDraftAlert(true);
		else close();
	};

	const handleSaveDraft = () => {
		saveDraft(getValues(), draft?.id);
		toast(t('pollCreator.draftSaved'));
		setShowSaveDraftAlert(false);
		close();
	};

	const handleDiscard = () => {
		setShowSaveDraftAlert(false);
		close();
	};

	/** A typed end can pass while the dialog is open; show the field so the error has a place. */
	const revealEndError = () => {
		if (getFieldState('endTime').invalid) setEndPreset(null);
	};

	// The review's buttons unmount with it, so focus would fall to the page: land on the question
	const backToWriting = () => {
		setReview(null);
		setTimeout(() => setFocus('title'));
	};

	const showReview = (values: PollFormValues) => {
		// eslint-disable-next-line react-hooks/purity -- only called from event handlers, never during render
		const now = Date.now();
		// localToIso, not formToInput: a corrupt draft time must not throw here
		const startTime =
			localToIso(values.startTime) ?? new Date(now).toISOString();
		const endTime = localToIso(values.endTime) ?? startTime;
		const status = derivePollStatus(
			{ active: true, votingActive: true, startTime, endTime },
			now
		);
		setReview({ status, startTime, endTime });
	};

	// handleSubmit, not trigger: it focuses the first error and re-validates fields as they change
	const goToReview = (e: FormEvent) =>
		handleSubmit(showReview, revealEndError)(e);

	const publish = handleSubmit(
		async (values: PollFormValues) => {
			const preset = END_PRESETS.find(({ key }) => key === endPreset);
			const input = formToInput(values, preset?.ms);
			const result = isEdit
				? await updatePoll(poll.id, input)
				: await createPoll(input);
			if (!result.ok) {
				setError('root', { message: apiErrorText(t, result) });
				return;
			}
			if (draft) deleteDraft(draft.id);
			toast(t(isEdit ? 'pollCreator.saved' : 'pollCreator.published'));
			close();
			onSaved?.();
			// A new poll's first job is collecting votes: land on it, next to the share button
			if (!isEdit && result.data?.id) router.push(`/poll/${result.data.id}`);
		},
		// Something changed since review (e.g. the end passed): back to writing, errors visible
		() => {
			setReview(null);
			revealEndError();
		}
	);

	const applyPreset = (key: string, ms: number) => {
		const start = getValues('startTime');
		// eslint-disable-next-line react-hooks/purity -- only called from event handlers, never during render
		const base = start ? Date.parse(start) : Date.now();
		setValue('endTime', toDateTimeInput(new Date(base + ms)), {
			shouldDirty: true,
			shouldValidate: !!errors.endTime,
		});
		setEndPreset(key);
	};

	const reapplyPreset = () => {
		const preset = END_PRESETS.find(({ key }) => key === endPreset);
		if (preset) applyPreset(preset.key, preset.ms);
	};

	// Each distinct message once, translated, with an id for aria-describedby (the first takes `id` itself)
	const fieldErrors = (id: string, messages: (string | undefined)[]) =>
		[...new Set(messages.filter((key): key is string => !!key))].map(
			(key, index) => ({
				id: index ? `${id}-${index}` : id,
				text: t(key),
			})
		);

	// One line under the list says each distinct problem once; every option points at its own
	const optionMessages = [
		...new Set(
			fields.flatMap((_, index) => errors.options?.[index]?.text?.message ?? [])
		),
	];
	const optionDescription = (index: number) => {
		const message = errors.options?.[index]?.text?.message;
		if (!message) return 'options-hint';
		const at = optionMessages.indexOf(message);
		return at ? `options-error-${at}` : 'options-error';
	};

	const addOption = () => {
		// An empty option comes first: take the user there instead of adding another
		const empty = options.findIndex((option) => !option.text.trim());
		if (empty === -1) append({ text: '' });
		// Say why, or the click looks like nothing when that option already had focus
		else
			setError(
				`options.${empty}.text`,
				{ message: 'pollCreator.errors.optionRequired' },
				{ shouldFocus: true }
			);
	};

	const canAddOption =
		fields.length < POLL_OPTIONS_LIMIT &&
		options.every((option) => option.text.trim());

	// A typed opening time stays in view even after a preset is picked, since presets count from it
	const showTimeFields = endPreset === null || !!startTime;

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				{!isEdit && triggerChildren && (
					<DialogTrigger render={triggerChildren} />
				)}
				{/* Full screen on phones, a 640px dialog from sm up */}
				<DialogContent
					showCloseButton={false}
					finalFocus={finalFocus}
					// Writing the question is always the first step
					initialFocus={() => document.getElementById('title')}
					className="flex h-dvh max-h-dvh max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 ring-0 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-[20px] sm:ring-1"
				>
					<div className="flex flex-none items-start gap-3 p-4 sm:p-5">
						<div className="min-w-0 flex-1 space-y-1">
							<DialogTitle
								ref={titleRef}
								tabIndex={-1}
								className="outline-none"
							>
								{review
									? t('pollCreator.reviewTitle')
									: t(isEdit ? 'pollCreator.editTitle' : 'pollCreator.title')}
							</DialogTitle>
							<DialogDescription className="text-body-4">
								{review
									? t('pollCreator.reviewPreview')
									: t(
											isEdit
												? 'pollCreator.editSubtitle'
												: 'pollCreator.subtitle'
										)}
							</DialogDescription>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={t('common.close')}
							className="-mt-2 -mr-2"
							onClick={() => handleOpenChange(false)}
						>
							<X className="size-[18px]" />
						</Button>
					</div>

					<form
						noValidate
						className="flex min-h-0 flex-1 flex-col"
						onKeyDown={(e) => {
							if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
							e.preventDefault();
							e.currentTarget.requestSubmit();
						}}
						onSubmit={(e) => {
							// A preset counts from now, not from when it was picked
							reapplyPreset();
							if (review) {
								// Cmd+Return can land while a publish is still out
								if (isSubmitting) e.preventDefault();
								else publish(e);
							} else {
								goToReview(e);
							}
						}}
					>
						{/* relative: the leaving step is laid over the arriving one while both animate.
						    flex-auto, not flex-1: the height it animates to must count.
						    A stable gutter on both edges: the leaving step's scrollbar would narrow the arriving
						    step, which then rewraps and snaps to a new height when the scrollbar goes */}
						<m.div
							className="relative min-h-0 flex-auto overflow-x-hidden overflow-y-auto"
							initial={false}
							animate={stepHeight && { height: stepHeight.height }}
							transition={
								stepHeight?.animate && !reduceMotion ? ENTER : { duration: 0 }
							}
						>
							<AnimatePresence
								initial={false}
								mode="popLayout"
								custom={review ? 1 : -1}
							>
								<m.div
									key={review ? 'review' : 'write'}
									custom={review ? 1 : -1}
									variants={reduceMotion ? STEP_FADE : STEP_VARIANTS}
									initial="enter"
									animate="center"
									exit="exit"
								>
									<StepLayer
										step={review ? 'review' : 'write'}
										onResize={onStepResize}
									>
										{review ? (
											<>
												<div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
													<StatusChip
														status={review.status}
														poll={review}
														time="inline"
													/>
													<div className="space-y-2">
														<p className="text-title-3 text-balance wrap-anywhere">
															{toSingleLine(title)}
														</p>
														{description?.trim() && (
															<p className="text-body-4 leading-relaxed text-muted-foreground wrap-anywhere whitespace-pre-line">
																{description.trim()}
															</p>
														)}
													</div>
													<ul className="space-y-2">
														{options.map((option, index) => (
															<li
																key={fields[index]?.id ?? index}
																className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-body-3"
															>
																<BallotMark state="rest" />
																<span className="min-w-0 flex-1 wrap-anywhere">
																	{option.text.trim()}
																</span>
															</li>
														))}
													</ul>
												</div>
												<TideRules>
													<TideRule icon={Users}>
														{t(`pollCreator.ruleAudience.${audience}`)}
													</TideRule>
													<TideRule icon={Lock}>
														{t('pollCreator.ruleSealed')}
													</TideRule>
													<TideRule icon={Eye}>
														{joinSentences(
															currentLanguage,
															t(`pollCreator.ruleVisibility.${level}`),
															t('pollCreator.ruleFixed')
														)}
													</TideRule>
													<TideRule icon={User}>
														{t('pollCreator.ruleOneVote')}
													</TideRule>
												</TideRules>
											</>
										) : (
											<>
												<section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
													<div className="space-y-2">
														<div className="space-y-0.5">
															<Label htmlFor="title" className={LABEL}>
																{t('pollCreator.questionLabel')}
															</Label>
															<p className="text-caption-1 text-muted-foreground">
																<FieldMessage
																	hint={t('pollCreator.questionNote')}
																	hintId="title-hint"
																	errors={fieldErrors('title-error', [
																		errors.title?.message,
																	])}
																/>
															</p>
														</div>
														<Textarea
															id="title"
															placeholder={t('pollCreator.questionPlaceholder')}
															className="min-h-20 resize-none text-body-1 leading-snug tracking-title md:text-body-1"
															maxLength={POLL_TITLE_MAX}
															aria-invalid={!!errors.title}
															aria-describedby={
																errors.title ? 'title-error' : 'title-hint'
															}
															enterKeyHint="next"
															{...register('title')}
															// The question is one line: Return moves on to the options
															onKeyDown={(e) => {
																if (!isPlainReturn(e)) return;
																e.preventDefault();
																focusField(e, 'options.0.text');
															}}
														/>
														<p className="text-right text-caption-2 text-muted-foreground tabular-nums">
															{title.length}/{POLL_TITLE_MAX}
														</p>
													</div>

													<AnimatePresence initial={false}>
														{showContext && (
															<Unfold key="context">
																<div className="space-y-2">
																	<Label
																		htmlFor="description"
																		className={LABEL}
																	>
																		{t('pollCreator.descriptionLabel')} (
																		{t('common.optional')})
																	</Label>
																	<Textarea
																		id="description"
																		placeholder={t(
																			'pollCreator.descriptionPlaceholder'
																		)}
																		className="min-h-20 resize-none"
																		{...register('description')}
																	/>
																</div>
															</Unfold>
														)}
													</AnimatePresence>
													{!showContext && (
														<Button
															type="button"
															variant="link"
															size="md"
															// Keeps the 44px target without spacing the section apart
															className="-my-2.5 self-start"
															onClick={() => {
																setShowContext(true);
																// The button goes away: carry focus into the field it opened
																setTimeout(() => setFocus('description'));
															}}
														>
															{t('pollCreator.addContext')}
														</Button>
													)}

													<fieldset>
														<legend className={LABEL}>
															{t('pollCreator.pollOptionsLabel')}
														</legend>
														<p className="mt-0.5 text-caption-1 text-muted-foreground">
															<FieldMessage
																hint={t('pollCreator.optionsHint')}
																hintId="options-hint"
																errors={fieldErrors(
																	'options-error',
																	optionMessages
																)}
															/>
														</p>
														<div className="mt-3">
															<AnimatePresence initial={false}>
																{fields.map((field, index) => (
																	<Unfold key={field.id}>
																		{/* The gap is padding inside the fold, so it opens and closes with the row */}
																		<div className="pb-2">
																			<div className="relative">
																				<Input
																					aria-label={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
																					placeholder={t(
																						'pollCreator.optionsPlaceholder'
																					)}
																					maxLength={POLL_OPTION_MAX}
																					enterKeyHint="next"
																					aria-invalid={
																						!!errors.options?.[index]?.text
																					}
																					aria-describedby={optionDescription(
																						index
																					)}
																					{...register(`options.${index}.text`, {
																						// Before review nothing re-validates as you type, so clear Add option's error here
																						onChange: () => {
																							if (!isSubmitted)
																								clearErrors(`options.${index}.text`);
																						},
																					})}
																					// Every row leaves room for the remove button, so adding a third option moves nothing
																					className="pr-12"
																					onKeyDown={(e) => {
																						// Cmd/Ctrl+Return submits the form; Return that commits IME text (Zhuyin etc.) isn't one
																						if (!isPlainReturn(e)) return;
																						// Return moves to the next option, or adds one, instead of submitting
																						e.preventDefault();
																						if (index < fields.length - 1)
																							focusField(
																								e,
																								`options.${index + 1}.text`
																							);
																						else if (canAddOption)
																							append({ text: '' });
																					}}
																				/>
																				{fields.length > POLL_OPTIONS_MIN && (
																					<Button
																						type="button"
																						variant="ghost"
																						size="icon"
																						aria-label={`${t('pollCreator.removeOption')} ${index + 1}`}
																						onClick={() => {
																							remove(index);
																							// The button leaves with its row: keep focus in the list
																							setTimeout(() =>
																								setFocus(
																									`options.${Math.max(index - 1, 0)}.text`
																								)
																							);
																						}}
																						className="absolute inset-y-0 right-0.5 my-auto text-muted-foreground duration-150 animate-in fade-in zoom-in-75 motion-reduce:animate-none hover:bg-transparent hover:text-destructive"
																					>
																						<X className="size-4" />
																					</Button>
																				)}
																			</div>
																		</div>
																	</Unfold>
																))}
															</AnimatePresence>
														</div>
														{fields.length < POLL_OPTIONS_LIMIT && (
															<Button
																type="button"
																variant="outline"
																onClick={addOption}
																className="mt-2"
															>
																<Plus />
																{t('pollCreator.addOptionLabel')}
															</Button>
														)}
													</fieldset>
												</section>

												<section
													aria-labelledby="poll-settings-title"
													className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
												>
													<h3
														id="poll-settings-title"
														className="text-title-4"
													>
														{t('pollCreator.settingsTitle')}
													</h3>

													<fieldset>
														<legend className={LABEL}>
															{t('pollCreator.endsLabel')}
														</legend>
														<div className="mt-3 flex flex-wrap gap-2">
															{END_PRESETS.map(({ key, label, ms }) => (
																<Button
																	key={key}
																	type="button"
																	size="sm"
																	variant={
																		endPreset === key ? 'default' : 'outline'
																	}
																	aria-pressed={endPreset === key}
																	className="rounded-full"
																	onClick={() => applyPreset(key, ms)}
																>
																	{t(label)}
																</Button>
															))}
															<Button
																type="button"
																size="sm"
																variant={
																	endPreset === null ? 'default' : 'outline'
																}
																aria-pressed={endPreset === null}
																className="rounded-full"
																onClick={() => setEndPreset(null)}
															>
																{t('pollCreator.presetCustom')}
															</Button>
														</div>
														<AnimatePresence initial={false}>
															{showTimeFields && (
																<Unfold key="times">
																	<div className="grid gap-4 pt-4 sm:grid-cols-2">
																		<div className="space-y-2">
																			<Label htmlFor="startTime">
																				{t('pollCreator.opensLabel')}
																			</Label>
																			<Input
																				id="startTime"
																				type="datetime-local"
																				aria-describedby="startTime-hint"
																				{...register('startTime', {
																					onChange: reapplyPreset,
																				})}
																			/>
																			<p
																				id="startTime-hint"
																				className="text-caption-2 text-muted-foreground"
																			>
																				{t('pollCreator.opensHint')}
																			</p>
																		</div>
																		<div className="space-y-2">
																			<Label htmlFor="endTime">
																				{t('pollCreator.endsAtLabel')}
																			</Label>
																			<Input
																				id="endTime"
																				type="datetime-local"
																				aria-invalid={!!errors.endTime}
																				aria-describedby={
																					errors.endTime
																						? 'endTime-error'
																						: undefined
																				}
																				{...register('endTime', {
																					onChange: () => setEndPreset(null),
																				})}
																			/>
																			<p className="text-caption-2">
																				<FieldMessage
																					errors={fieldErrors('endTime-error', [
																						errors.endTime?.message,
																					])}
																				/>
																			</p>
																		</div>
																	</div>
																</Unfold>
															)}
														</AnimatePresence>
													</fieldset>

													<Controller
														control={control}
														name="audience"
														render={({ field }) => (
															<PillGroup
																legend={t('pollCreator.audienceLabel')}
																note={t('pollCreator.audienceNote')}
																hint={t(
																	`pollCreator.audienceHint.${field.value}`
																)}
																value={field.value}
																onChange={field.onChange}
																options={AudienceSchema.options.map(
																	(value) => ({
																		value,
																		label: t(
																			`pollCreator.audienceOption.${value}`
																		),
																	})
																)}
															/>
														)}
													/>

													{isInviteOnly && (
														<div className="space-y-2">
															<Label htmlFor="invitees">
																{t('pollCreator.inviteesLabel')}
															</Label>
															<Controller
																control={control}
																name="invitees"
																render={({ field }) =>
																	field.value ? (
																		<InviteePicker
																			id="invitees"
																			withGroups
																			value={field.value}
																			onChange={field.onChange}
																			invalid={!!errors.invitees}
																			describedBy={
																				errors.invitees
																					? 'invitees-error'
																					: 'invitees-hint'
																			}
																		/>
																	) : (
																		<p className="text-caption-2 text-muted-foreground">
																			{t('pollCreator.inviteesManaged')}
																		</p>
																	)
																}
															/>
															<p className="text-caption-2 text-muted-foreground">
																<FieldMessage
																	hint={t('pollCreator.inviteesHint')}
																	hintId="invitees-hint"
																	errors={fieldErrors('invitees-error', [
																		errors.invitees?.message,
																	])}
																/>
															</p>
														</div>
													)}

													<Controller
														control={control}
														name="voterVisibility"
														render={({ field }) => (
															<PillGroup
																legend={t('pollCreator.visibilityLabel')}
																note={t('pollCreator.visibilityNote')}
																hint={t(
																	`pollCreator.visibility.${visibilityLevel({ voterVisibility: field.value, audience })}Hint`
																)}
																value={field.value}
																onChange={field.onChange}
																options={VISIBILITY_ORDER.map((value) => ({
																	value,
																	label: t(
																		`pollCreator.visibility.${visibilityLevel({ voterVisibility: value, audience })}`
																	),
																}))}
															/>
														)}
													/>
												</section>
											</>
										)}
									</StepLayer>
								</m.div>
							</AnimatePresence>
						</m.div>

						<div className="flex-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5">
							{/* Rendered empty first, so a failed publish is announced every time, the same error included */}
							<p
								role="alert"
								className="text-caption-1 text-destructive not-empty:mb-3"
							>
								{review && errors.root?.message}
							</p>
							<div className="flex flex-wrap justify-end gap-2">
								{!review && !isEdit && (
									<Button
										type="button"
										variant="outline"
										className="flex-1 sm:flex-none"
										onClick={handleSaveDraft}
									>
										{t('pollCreator.saveDraftLabel')}
									</Button>
								)}
								{review && (
									<Button
										type="button"
										variant="outline"
										className="flex-1 sm:flex-none"
										onClick={backToWriting}
									>
										{t('common.edit')}
									</Button>
								)}
								{review ? (
									<Button
										type="submit"
										className="flex-1 sm:flex-none"
										loading={isSubmitting}
									>
										{t(
											isEdit ? 'pollCreator.saveChanges' : 'pollCreator.publish'
										)}
									</Button>
								) : (
									<Button type="submit" className="flex-1 sm:flex-none">
										{t('pollCreator.review')}
									</Button>
								)}
							</div>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={showSaveDraftAlert}
				onOpenChange={setShowSaveDraftAlert}
			>
				{isEdit ? (
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{t('pollCreator.discardEditTitle')}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{t('pollCreator.discardEditBody')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								{t('pollCreator.keepEditing')}
							</AlertDialogCancel>
							<AlertDialogAction onClick={handleDiscard}>
								{t('pollCreator.discardEdit')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				) : (
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{t('pollCreator.keepDraftTitle')}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{t('pollCreator.keepDraftBody')}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={handleDiscard}>
								{t('pollCreator.discardEdit')}
							</AlertDialogCancel>
							<AlertDialogAction onClick={handleSaveDraft}>
								{t('pollCreator.keepDraft')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				)}
			</AlertDialog>
		</>
	);
}

type PillGroupProps<T extends string> = {
	legend: string;
	/** Under the legend. */
	note: string;
	/** What the chosen pill means, under the pills. */
	hint: string;
	value: T;
	onChange: (value: T) => void;
	options: { value: T; label: string }[];
};

/** One choice of a few, as toggle pills. */
function PillGroup<T extends string>({
	legend,
	note,
	hint,
	value,
	onChange,
	options,
}: PillGroupProps<T>) {
	const noteId = useId();
	const hintId = useId();
	return (
		<fieldset aria-describedby={`${noteId} ${hintId}`}>
			<legend className={LABEL}>{legend}</legend>
			<p id={noteId} className="mt-0.5 text-caption-1 text-muted-foreground">
				{note}
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{options.map((option) => (
					<Button
						key={option.value}
						type="button"
						size="sm"
						variant={option.value === value ? 'default' : 'outline'}
						aria-pressed={option.value === value}
						className="rounded-full"
						onClick={() => onChange(option.value)}
					>
						{option.label}
					</Button>
				))}
			</div>
			<p id={hintId} className="mt-2 text-caption-1 text-muted-foreground">
				{hint}
			</p>
		</fieldset>
	);
}
