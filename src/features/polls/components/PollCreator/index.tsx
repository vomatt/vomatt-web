'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, m, useIsPresent, useReducedMotion } from 'motion/react';
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
import {
	Controller,
	useFieldArray,
	useForm,
	type UseFormRegisterReturn,
	useWatch,
} from 'react-hook-form';
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
import { ArrowLeft, Plus, X } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { ENTER, EXIT, Unfold } from '@/components/Unfold';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';

import { deleteDraft, type PollDraft, saveDraft } from '../../drafts';
import { formatPollDate, joinSentences } from '../../format';
import {
	AudienceSchema,
	type Poll,
	POLL_OPTION_MAX,
	POLL_OPTIONS_LIMIT,
	POLL_OPTIONS_MIN,
	POLL_TITLE_MAX,
	VoterVisibilitySchema,
} from '../../schema';
import { createPoll, updatePoll } from '../../service';
import { derivePollStatus, type PollStatus, visibilityLevel } from '../../status';
import { BallotMark } from '../BallotMotion';
import { InviteePicker } from '../InviteePicker';
import { StatusChip } from '../StatusChip';
import {
	emptyPollForm,
	formToInput,
	pollFormSchema,
	type PollFormValues,
	pollToForm,
	TIMING_FIELDS,
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

/** Writing and review slide toward where the step goes: forward to the left, back to the right. */
const STEP_VARIANTS = {
	enter: (direction: number) => ({ opacity: 0, x: direction * 16, filter: 'blur(4px)' }),
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
		const observer = new ResizeObserver(() => onResize(step, element.offsetHeight));
		observer.observe(element);
		return () => observer.disconnect();
	}, [isPresent, onResize, step]);
	return (
		<div ref={ref} inert={!isPresent} className="space-y-7 px-4 py-6 sm:px-6">
			{children}
		</div>
	);
}

/**
 * Write everything on one screen, then review it the way voters will see it.
 * Status and times are fixed when entering review; a Closing chip still counts down.
 */
type ReviewSnapshot = { status: PollStatus; startTime: string; endTime: string };

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
		e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing && e.keyCode !== 229
	);
}

/**
 * Focus another field right away. react-hook-form's setFocus waits a tick,
 * so keys typed in between would land in the field being left.
 */
function focusField(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) {
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
	const [showSettings, setShowSettings] = useState(false);
	const [showContext, setShowContext] = useState(!!defaults.description);
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
		formState: { errors, isDirty, isSubmitting },
	} = useForm({
		resolver: zodResolver(pollFormSchema),
		defaultValues: defaults,
	});
	const { fields, append, remove } = useFieldArray({ control, name: 'options' });
	const [title, description, options, startTime, endTime, voterVisibility, audience] = useWatch({
		control,
		name: ['title', 'description', 'options', 'startTime', 'endTime', 'voterVisibility', 'audience'],
	});
	const isInviteOnly = audience === 'invite-only';
	const titleRef = useRef<HTMLHeadingElement>(null);
	const reduceMotion = useReducedMotion();
	// The scroller follows the current step's height: animated when the step changes, at once
	// as the step itself grows (a section unfolding animates on its own)
	const [stepHeight, setStepHeight] = useState<{ height: number; animate: boolean }>();
	const measuredStep = useRef<string>(undefined);
	const onStepResize = useCallback((step: string, height: number) => {
		setStepHeight({ height, animate: measuredStep.current !== undefined && measuredStep.current !== step });
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
		setShowSettings(false);
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

	/** Errors in the folded section stay hidden, so unfold it. */
	const revealTimingErrors = () => {
		if (TIMING_FIELDS.some((name) => getFieldState(name).invalid)) setShowSettings(true);
	};

	// The review's buttons unmount with it, so focus would fall to the page: land on the question
	const backToWriting = () => {
		setReview(null);
		setTimeout(() => setFocus('title'));
	};

	const showReview = (values: PollFormValues) => {
		const now = Date.now();
		// localToIso, not formToInput: a corrupt draft time must not throw here
		const startTime = localToIso(values.startTime) ?? new Date(now).toISOString();
		const endTime = localToIso(values.endTime) ?? startTime;
		const status = derivePollStatus({ active: true, votingActive: true, startTime, endTime }, now);
		setReview({ status, startTime, endTime });
	};

	// handleSubmit, not trigger: it focuses the first error and re-validates fields as they change
	const goToReview = (e: FormEvent) => handleSubmit(showReview, revealTimingErrors)(e);

	const publish = handleSubmit(
		async (values: PollFormValues) => {
			const input = formToInput(values);
			const result = isEdit ? await updatePoll(poll.id, input) : await createPoll(input);
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
			revealTimingErrors();
		}
	);

	const applyPreset = (key: string, ms: number) => {
		const start = getValues('startTime');
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
		[...new Set(messages.filter((key): key is string => !!key))].map((key, index) => ({
			id: index ? `${id}-${index}` : id,
			text: t(key),
		}));

	// One line under the list says each distinct problem once; every option points at its own
	const optionMessages = [
		...new Set(fields.flatMap((_, index) => errors.options?.[index]?.text?.message ?? [])),
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
		else setFocus(`options.${empty}.text`);
	};

	const canAddOption =
		fields.length < POLL_OPTIONS_LIMIT && options.every((option) => option.text.trim());

	const formatLocal = (value: string) => {
		const iso = localToIso(value);
		return iso ? formatPollDate(iso, currentLanguage) : null;
	};
	const endLabel = formatLocal(endTime);
	const startLabel = formatLocal(startTime);
	let summaryTop = t('pollCreator.summaryNoEnd');
	if (endLabel) {
		summaryTop = startLabel
			? t('pollCreator.summaryOpensLater', { start: startLabel, end: endLabel })
			: t('pollCreator.summaryOpensNow', { end: endLabel });
	}

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				{!isEdit && triggerChildren && <DialogTrigger render={triggerChildren} />}
				{/* Full screen on phones, a 560px dialog from sm up */}
				<DialogContent
					showCloseButton={false}
					finalFocus={finalFocus}
					// Writing the question is always the first step
					initialFocus={() => document.getElementById('title')}
					className="flex h-dvh max-h-dvh max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 ring-0 sm:h-auto sm:max-h-[min(90dvh,780px)] sm:max-w-[560px] sm:rounded-xl sm:border sm:ring-1"
				>
					<div className="flex h-14 flex-none items-center justify-between gap-2 border-b border-border px-2 sm:px-3">
						{review ? (
							<Button key="edit" type="button" variant="ghost" onClick={backToWriting}>
								<ArrowLeft />
								{t('common.edit')}
							</Button>
						) : (
							<Button key="cancel" type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
								{t('common.cancel')}
							</Button>
						)}
						<DialogTitle
							ref={titleRef}
							tabIndex={-1}
							className="truncate text-base font-semibold outline-none"
						>
							{review
								? t('pollCreator.reviewTitle')
								: t(isEdit ? 'pollCreator.editTitle' : 'pollCreator.title')}
						</DialogTitle>
						{/* Balances the leading button so the title stays centered */}
						<span aria-hidden className="w-20" />
					</div>
					<DialogDescription className="sr-only">
						{t(isEdit ? 'pollCreator.editSubtitle' : 'pollCreator.subtitle')}
					</DialogDescription>

					<form
						noValidate
						className="flex min-h-0 flex-1 flex-col"
						onKeyDown={(e) => {
							if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
							e.preventDefault();
							e.currentTarget.requestSubmit();
						}}
						onSubmit={(e) => {
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
						    flex-auto, not flex-1: the height it animates to must count */}
						<m.div
							className="relative min-h-0 flex-auto overflow-x-hidden overflow-y-auto"
							initial={false}
							animate={stepHeight && { height: stepHeight.height }}
							transition={stepHeight?.animate && !reduceMotion ? ENTER : { duration: 0 }}
						>
							<AnimatePresence initial={false} mode="popLayout" custom={review ? 1 : -1}>
								<m.div
									key={review ? 'review' : 'write'}
									custom={review ? 1 : -1}
									variants={reduceMotion ? STEP_FADE : STEP_VARIANTS}
									initial="enter"
									animate="center"
									exit="exit"
								>
									<StepLayer step={review ? 'review' : 'write'} onResize={onStepResize}>
										{review ? (
											<>
												<div className="space-y-3">
													<p className="text-sm font-medium">{t('pollCreator.reviewPreview')}</p>
													<div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
														<StatusChip status={review.status} poll={review} />
														<div className="space-y-2">
															<p className="text-[22px] leading-tight tracking-[-0.02em] wrap-anywhere">
																{toSingleLine(title)}
															</p>
															{description?.trim() && (
																<p className="text-[15px] leading-relaxed text-muted-foreground wrap-anywhere">
																	{description.trim()}
																</p>
															)}
														</div>
														<ul className="space-y-2">
															{options.map((option, index) => (
																<li
																	key={fields[index]?.id ?? index}
																	className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-base"
																>
																	<BallotMark checked={false} />
																	<span className="min-w-0 flex-1 wrap-anywhere">{option.text.trim()}</span>
																</li>
															))}
														</ul>
													</div>
												</div>
												<ul className="space-y-3 text-[15px] leading-relaxed">
													<li>{t(`pollCreator.ruleAudience.${audience}`)}</li>
													<li>{t('pollCreator.ruleSealed')}</li>
													<li>
														{joinSentences(
															currentLanguage,
															t(`pollCreator.ruleVisibility.${level}`),
															t('pollCreator.ruleFixed')
														)}
													</li>
													<li>{t('pollCreator.ruleOneVote')}</li>
												</ul>
											</>
										) : (
											<>
												<div className="space-y-2">
													<Label htmlFor="title">{t('pollCreator.questionLabel')}</Label>
													<Textarea
														id="title"
														placeholder={t('pollCreator.questionPlaceholder')}
														className="min-h-24 resize-none text-xl leading-snug tracking-[-0.01em] md:text-xl"
														maxLength={POLL_TITLE_MAX}
														aria-invalid={!!errors.title}
														aria-describedby={errors.title ? 'title-error' : 'title-hint'}
														enterKeyHint="next"
														{...register('title')}
														// The question is one line: Return moves on to the options
														onKeyDown={(e) => {
															if (!isPlainReturn(e)) return;
															e.preventDefault();
															focusField(e, 'options.0.text');
														}}
													/>
													<div className="flex items-start justify-between gap-3 text-[13px] text-muted-foreground">
														<FieldMessage
															hint={t('pollCreator.questionNote')}
															hintId="title-hint"
															errors={fieldErrors('title-error', [errors.title?.message])}
														/>
														<span className="font-mono tabular-nums">
															{title.length}/{POLL_TITLE_MAX}
														</span>
													</div>
												</div>

												<AnimatePresence initial={false}>
													{showContext && (
														<Unfold key="context">
															<div className="space-y-2">
																<Label htmlFor="description">
																	{t('pollCreator.descriptionLabel')} ({t('common.optional')})
																</Label>
																<Textarea
																	id="description"
																	placeholder={t('pollCreator.descriptionPlaceholder')}
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
														variant="ghost"
														className="-mx-2 -mt-4 mb-2 px-2"
														onClick={() => {
															setShowContext(true);
															// The button goes away: carry focus into the field it opened
															setTimeout(() => setFocus('description'));
														}}
													>
														<Plus />
														{t('pollCreator.addContext')}
													</Button>
												)}

												<fieldset className="space-y-2">
													<legend className="mb-2 text-sm font-medium">
														{t('pollCreator.pollOptionsLabel')}
													</legend>
													{fields.map((field, index) => (
														<div key={field.id} className="flex items-center gap-2">
															<Input
																aria-label={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
																placeholder={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
																maxLength={POLL_OPTION_MAX}
																enterKeyHint="next"
																aria-invalid={!!errors.options?.[index]?.text}
																aria-describedby={optionDescription(index)}
																{...register(`options.${index}.text`)}
																onKeyDown={(e) => {
																	// Cmd/Ctrl+Return submits the form; Return that commits IME text (Zhuyin etc.) isn't one
																	if (!isPlainReturn(e)) return;
																	// Return moves to the next option, or adds one, instead of submitting
																	e.preventDefault();
																	if (index < fields.length - 1) focusField(e, `options.${index + 1}.text`);
																	else if (canAddOption) append({ text: '' });
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
																		setTimeout(() => setFocus(`options.${Math.max(index - 1, 0)}.text`));
																	}}
																	className="text-muted-foreground hover:text-destructive"
																>
																	<X className="size-4" />
																</Button>
															)}
														</div>
													))}
													{fields.length < POLL_OPTIONS_LIMIT && (
														<Button
															type="button"
															variant="outline"
															onClick={addOption}
															className="w-full border-dashed bg-transparent"
														>
															<Plus />
															{t('pollCreator.addOptionLabel')}
														</Button>
													)}
													<p className="text-[13px] text-muted-foreground">
														<FieldMessage
															hint={t('pollCreator.optionsHint')}
															hintId="options-hint"
															errors={fieldErrors('options-error', optionMessages)}
														/>
													</p>
												</fieldset>

												<div className="space-y-3">
													<button
														type="button"
														aria-expanded={showSettings}
														aria-controls="poll-settings"
														onClick={() => setShowSettings((value) => !value)}
														className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-border-strong"
													>
														<span className="flex-1 space-y-0.5">
															<span className="block text-[15px] font-medium">{summaryTop}</span>
															<span className="block text-sm text-muted-foreground">
																{joinSentences(
																	currentLanguage,
																	t(`pollCreator.summaryAudience.${audience}`),
																	t(`pollCreator.ruleVisibility.${level}`)
																)}
															</span>
														</span>
														<span className="text-[15px] font-medium underline underline-offset-4">
															{showSettings ? t('pollCreator.settingsDone') : t('pollCreator.settingsChange')}
														</span>
													</button>

													<AnimatePresence initial={false}>
														{showSettings && (
															<Unfold key="settings">
																<section
																	id="poll-settings"
																	aria-label={t('pollCreator.settingsTitle')}
																	className="space-y-6 pt-3"
																>
																	<div className="space-y-2">
																		<Label htmlFor="startTime">{t('pollCreator.opensLabel')}</Label>
																		<Input
																			id="startTime"
																			type="datetime-local"
																			aria-describedby="startTime-hint"
																			{...register('startTime', { onChange: reapplyPreset })}
																		/>
																		<p id="startTime-hint" className="text-[13px] text-muted-foreground">
																			{t('pollCreator.opensHint')}
																		</p>
																	</div>

																	<div className="space-y-2">
																		<Label htmlFor="endTime">{t('pollCreator.endsLabel')}</Label>
																		<Input
																			id="endTime"
																			type="datetime-local"
																			aria-invalid={!!errors.endTime}
																			aria-describedby={errors.endTime ? 'endTime-error' : undefined}
																			{...register('endTime', { onChange: () => setEndPreset(null) })}
																		/>
																		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
																			{END_PRESETS.map(({ key, label, ms }) => (
																				<Button
																					key={key}
																					type="button"
																					size="sm"
																					variant={endPreset === key ? 'default' : 'outline'}
																					aria-pressed={endPreset === key}
																					onClick={() => applyPreset(key, ms)}
																				>
																					{t(label)}
																				</Button>
																			))}
																		</div>
																		<p className="text-[13px]">
																			<FieldMessage errors={fieldErrors('endTime-error', [errors.endTime?.message])} />
																		</p>
																	</div>

																	<RadioCards
																		legend={t('pollCreator.audienceLabel')}
																		note={t('pollCreator.audienceNote')}
																		input={register('audience')}
																		options={AudienceSchema.options.map((level) => ({
																			value: level,
																			label: t(`poll.audience.${level}`),
																			hint: t(`pollCreator.audienceHint.${level}`),
																		}))}
																	/>

																	{isInviteOnly && (
																		<div className="space-y-2">
																			<Label htmlFor="invitees">{t('pollCreator.inviteesLabel')}</Label>
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
																							describedBy={errors.invitees ? 'invitees-error' : 'invitees-hint'}
																						/>
																					) : (
																						<p className="text-[13px] text-muted-foreground">
																							{t('pollCreator.inviteesManaged')}
																						</p>
																					)
																				}
																			/>
																			<p className="text-[13px] text-muted-foreground">
																				<FieldMessage
																					hint={t('pollCreator.inviteesHint')}
																					hintId="invitees-hint"
																					errors={fieldErrors('invitees-error', [errors.invitees?.message])}
																				/>
																			</p>
																		</div>
																	)}

																	<RadioCards
																		legend={t('pollCreator.visibilityLabel')}
																		note={t('pollCreator.visibilityNote')}
																		input={register('voterVisibility')}
																		options={VoterVisibilitySchema.options.map((level) => ({
																			value: level,
																			label: t(`pollCreator.visibility.${level}`),
																			hint: t(`pollCreator.visibility.${level}Hint`),
																		}))}
																	/>
																</section>
															</Unfold>
														)}
													</AnimatePresence>
												</div>
											</>
										)}
									</StepLayer>
								</m.div>
							</AnimatePresence>
						</m.div>

						<div className="flex-none border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
							{/* Rendered empty first, so a failed publish is announced every time, the same error included */}
							<p role="alert" className="text-sm text-destructive not-empty:mb-3">
								{review && errors.root?.message}
							</p>
							<div className="flex items-center gap-3">
								{!review && !isEdit && (
									<Button type="button" variant="ghost" onClick={handleSaveDraft}>
										{t('pollCreator.saveDraftLabel')}
									</Button>
								)}
								{/* The header's Edit is out of thumb reach on a full-screen phone sheet */}
								{review && (
									<Button
										type="button"
										variant="ghost"
										className="sm:hidden"
										onClick={backToWriting}
									>
										{t('common.edit')}
									</Button>
								)}
								{review ? (
									<Button
										type="submit"
										className="flex-1 sm:ml-auto sm:max-w-48"
										loading={isSubmitting}
									>
										{t(isEdit ? 'pollCreator.saveChanges' : 'pollCreator.publish')}
									</Button>
								) : (
									<Button type="submit" className="flex-1 sm:ml-auto sm:max-w-40">
										{t('pollCreator.review')}
									</Button>
								)}
							</div>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={showSaveDraftAlert} onOpenChange={setShowSaveDraftAlert}>
				{isEdit ? (
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('pollCreator.discardEditTitle')}</AlertDialogTitle>
							<AlertDialogDescription>{t('pollCreator.discardEditBody')}</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t('pollCreator.keepEditing')}</AlertDialogCancel>
							<AlertDialogAction onClick={handleDiscard}>
								{t('pollCreator.discardEdit')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				) : (
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('pollCreator.keepDraftTitle')}</AlertDialogTitle>
							<AlertDialogDescription>{t('pollCreator.keepDraftBody')}</AlertDialogDescription>
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

type RadioCardsProps = {
	legend: string;
	/** Shown under the cards. */
	note: string;
	input: UseFormRegisterReturn;
	options: { value: string; label: string; hint: string }[];
};

/** A radio group of bordered cards, each a label and a hint, for the folded settings. */
function RadioCards({ legend, note, input, options }: RadioCardsProps) {
	const noteId = useId();
	return (
		<fieldset className="space-y-2" aria-describedby={noteId}>
			<legend className="mb-2 text-sm font-medium">{legend}</legend>
			{options.map(({ value, label, hint }) => (
				<label
					key={value}
					className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[15px] transition-colors hover:border-border-strong has-[:checked]:border-foreground has-[:checked]:bg-volt-tint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
				>
					<input
						type="radio"
						value={value}
						className="size-5 shrink-0 accent-[var(--foreground)]"
						{...input}
					/>
					<span>
						<span className="font-medium">{label}</span>
						<small className="block text-sm text-muted-foreground">{hint}</small>
					</span>
				</label>
			))}
			<p id={noteId} className="pt-1 text-[13px] text-muted-foreground">
				{note}
			</p>
		</fieldset>
	);
}
