'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { ButtonLoading } from '@/components/ButtonLoading';
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
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, Plus, X } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';

import { deleteDraft, type PollDraft, saveDraft } from '../../drafts';
import { formatPollDate } from '../../format';
import {
	type Poll,
	POLL_OPTION_MAX,
	POLL_OPTIONS_LIMIT,
	POLL_OPTIONS_MIN,
	POLL_TITLE_MAX,
	VoterVisibilitySchema,
} from '../../schema';
import { createPoll, updatePoll } from '../../service';
import { derivePollStatus, type PollStatus } from '../../status';
import { BallotMark } from '../BallotMotion';
import { StatusChip } from '../StatusChip';
import {
	emptyPollForm,
	formToInput,
	pollFormSchema,
	type PollFormValues,
	pollToForm,
	TIMING_FIELDS,
	toDateTimeInput,
} from './formSchema';

const HOUR = 3600_000;
const END_PRESETS = [
	{ key: '1h', label: 'pollCreator.preset1h', ms: HOUR },
	{ key: '24h', label: 'pollCreator.preset24h', ms: 24 * HOUR },
	{ key: '3d', label: 'pollCreator.preset3d', ms: 3 * 24 * HOUR },
	{ key: '1w', label: 'pollCreator.preset1w', ms: 7 * 24 * HOUR },
] as const;

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
}

function initialValues(poll?: Poll, draft?: PollDraft) {
	if (poll) return pollToForm(poll);
	return draft?.values ?? emptyPollForm();
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
		trigger,
		reset,
		getValues,
		getFieldState,
		setValue,
		setError,
		formState: { errors, isDirty, isSubmitting },
	} = useForm({
		resolver: zodResolver(pollFormSchema),
		defaultValues: defaults,
	});
	const { fields, append, remove } = useFieldArray({ control, name: 'options' });
	const [title, description, options, startTime, endTime, voterVisibility] = useWatch({
		control,
		name: ['title', 'description', 'options', 'startTime', 'endTime', 'voterVisibility'],
	});

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

	const goToReview = async () => {
		if (!(await trigger())) {
			revealTimingErrors();
			return;
		}
		const values = getValues();
		const now = Date.now();
		// localToIso, not formToInput: a corrupt draft time must not throw here
		const startTime = localToIso(values.startTime) ?? new Date(now).toISOString();
		const endTime = localToIso(values.endTime) ?? startTime;
		const status = derivePollStatus({ active: true, votingActive: true, startTime, endTime }, now);
		setReview({ status, startTime, endTime });
	};

	const publish = handleSubmit(
		async (values: PollFormValues) => {
			const input = formToInput(values);
			const result = isEdit ? await updatePoll(poll.id, input) : await createPoll(input);
			if (!result.ok) {
				setError('root', { message: result.message });
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

	const errorText = (message?: string) =>
		message ? <p className="text-[13px] text-destructive">{t(message)}</p> : null;

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
				{!isEdit && (
					<DialogTrigger render={triggerChildren}>
						{!triggerChildren && <Plus />}
					</DialogTrigger>
				)}
				{/* Full screen on phones, a 560px dialog from sm up */}
				<DialogContent
					showCloseButton={false}
					className="flex h-dvh max-h-dvh max-w-none flex-col gap-0 rounded-none bg-background p-0 ring-0 sm:h-auto sm:max-h-[min(90dvh,780px)] sm:max-w-[560px] sm:rounded-xl sm:ring-1"
				>
					<div className="flex h-14 flex-none items-center justify-between gap-2 border-b border-border px-2 sm:px-3">
						{review ? (
							<Button type="button" variant="ghost" onClick={() => setReview(null)}>
								<ArrowLeft />
								{t('common.edit')}
							</Button>
						) : (
							<Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
								{t('common.cancel')}
							</Button>
						)}
						<DialogTitle className="truncate text-base font-semibold">
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
						onSubmit={(e) => {
							if (review) {
								publish(e);
							} else {
								e.preventDefault();
								goToReview();
							}
						}}
					>
						<div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-6 sm:px-6">
							{review ? (
								<>
									<div className="space-y-3">
										<p className="text-sm font-medium">{t('pollCreator.reviewPreview')}</p>
										<div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
											<StatusChip status={review.status} poll={review} />
											<div className="space-y-2">
												<p className="text-[22px] leading-tight tracking-[-0.02em]">{title.trim()}</p>
												{description?.trim() && (
													<p className="text-[15px] leading-relaxed text-muted-foreground">
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
														{option.text.trim()}
													</li>
												))}
											</ul>
										</div>
									</div>
									<ul className="space-y-3 text-[15px] leading-relaxed">
										<li>{t('pollCreator.ruleSealed')}</li>
										<li>
											{t(`pollCreator.ruleVisibility.${voterVisibility}`)} {t('pollCreator.ruleFixed')}
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
											{...register('title')}
										/>
										<div className="flex items-start justify-between gap-3 text-[13px] text-muted-foreground">
											<span>{t('pollCreator.questionNote')}</span>
											<span className="font-mono tabular-nums">
												{title.length}/{POLL_TITLE_MAX}
											</span>
										</div>
										{errorText(errors.title?.message)}
									</div>

									{showContext ? (
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
									) : (
										<Button
											type="button"
											variant="ghost"
											className="-mx-2 -my-4 px-2"
											onClick={() => setShowContext(true)}
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
											<div key={field.id} className="space-y-1">
												<div className="flex items-center gap-2">
													<Input
														aria-label={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
														placeholder={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
														maxLength={POLL_OPTION_MAX}
														enterKeyHint="next"
														aria-invalid={!!errors.options?.[index]?.text}
														{...register(`options.${index}.text`)}
														onKeyDown={(e) => {
															if (e.key !== 'Enter') return;
															// Enter that commits IME text (Zhuyin etc.) isn't a new line;
															// moving focus now would drop the composed text into the next option
															if (e.nativeEvent.isComposing || e.keyCode === 229) return;
															// Return adds the next option instead of submitting
															e.preventDefault();
															if (index === fields.length - 1 && canAddOption) append({ text: '' });
														}}
													/>
													{fields.length > POLL_OPTIONS_MIN && (
														<Button
															type="button"
															variant="ghost"
															size="icon"
															aria-label={t('pollCreator.removeOption')}
															onClick={() => remove(index)}
															className="text-muted-foreground hover:text-destructive"
														>
															<X className="size-4" />
														</Button>
													)}
												</div>
												{errorText(errors.options?.[index]?.text?.message)}
											</div>
										))}
										{fields.length < POLL_OPTIONS_LIMIT && (
											<Button
												type="button"
												variant="outline"
												onClick={() => append({ text: '' })}
												className="ml-[30px] w-[calc(100%-30px)] border-dashed bg-transparent"
												disabled={!canAddOption}
											>
												<Plus />
												{t('pollCreator.addOptionLabel')}
											</Button>
										)}
										<p className="ml-[30px] text-[13px] text-muted-foreground">
											{t('pollCreator.optionsHint')}
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
													{t('pollCreator.summaryVisibility', {
														level: t(`pollCreator.visibility.${voterVisibility}`),
													})}
												</span>
											</span>
											<span className="text-[15px] font-medium underline underline-offset-4">
												{showSettings ? t('pollCreator.settingsDone') : t('pollCreator.settingsChange')}
											</span>
										</button>

										{showSettings && (
											<section
												id="poll-settings"
												aria-label={t('pollCreator.settingsTitle')}
												className="space-y-6 rounded-xl border border-border bg-surface-soft p-4"
											>
												<div className="space-y-2">
													<Label htmlFor="startTime">{t('pollCreator.opensLabel')}</Label>
													<Input id="startTime" type="datetime-local" {...register('startTime')} />
													<p className="text-[13px] text-muted-foreground">{t('pollCreator.opensHint')}</p>
												</div>

												<div className="space-y-2">
													<Label htmlFor="endTime">{t('pollCreator.endsLabel')}</Label>
													<Input
														id="endTime"
														type="datetime-local"
														aria-invalid={!!errors.endTime}
														{...register('endTime', { onChange: () => setEndPreset(null) })}
													/>
													<div className="grid grid-cols-4 gap-2">
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
													{errorText(errors.endTime?.message)}
												</div>

												<fieldset className="space-y-2">
													<legend className="mb-2 text-sm font-medium">
														{t('pollCreator.visibilityLabel')}
													</legend>
													{VoterVisibilitySchema.options.map((level) => (
														<label
															key={level}
															className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[15px] transition-colors hover:border-border-strong has-[:checked]:border-foreground has-[:checked]:bg-volt-tint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
														>
															<input
																type="radio"
																value={level}
																className="size-5 shrink-0 accent-[var(--foreground)]"
																{...register('voterVisibility')}
															/>
															<span>
																<span className="font-medium">{t(`pollCreator.visibility.${level}`)}</span>
																<small className="block text-sm text-muted-foreground">
																	{t(`pollCreator.visibility.${level}Hint`)}
																</small>
															</span>
														</label>
													))}
													<p className="pt-1 text-[13px] text-muted-foreground">
														{t('pollCreator.visibilityNote')}
													</p>
												</fieldset>
											</section>
										)}
									</div>
								</>
							)}
						</div>

						<div className="flex-none space-y-3 border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
							{review && errors.root?.message && (
								<p role="alert" className="text-sm text-destructive">
									{errors.root.message}
								</p>
							)}
							<div className="flex items-center gap-3">
								{!review && !isEdit && (
									<Button type="button" variant="ghost" onClick={handleSaveDraft}>
										{t('pollCreator.saveDraftLabel')}
									</Button>
								)}
								{review ? (
									<ButtonLoading
										type="submit"
										className="flex-1 sm:ml-auto sm:max-w-48"
										disabled={isSubmitting}
										isLoading={isSubmitting}
									>
										{t(isEdit ? 'pollCreator.saveChanges' : 'pollCreator.publish')}
									</ButtonLoading>
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
							<AlertDialogTitle>Save to drafts?</AlertDialogTitle>
							<AlertDialogDescription>
								You have unsaved changes. Would you like to save this poll as a
								draft before leaving?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={handleDiscard}>Discard</AlertDialogCancel>
							<AlertDialogAction onClick={handleSaveDraft}>Save Draft</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				)}
			</AlertDialog>
		</>
	);
}
