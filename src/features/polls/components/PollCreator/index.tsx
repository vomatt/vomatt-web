'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
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
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, X } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { deleteDraft, type PollDraft, saveDraft } from '../../drafts';
import {
	type Poll,
	POLL_OPTION_MAX,
	POLL_OPTIONS_LIMIT,
	POLL_OPTIONS_MIN,
	POLL_TITLE_MAX,
	VoterVisibilitySchema,
} from '../../schema';
import { createPoll, updatePoll } from '../../service';
import {
	emptyPollForm,
	formToInput,
	pollFormSchema,
	type PollFormValues,
	pollToForm,
	STEP_FIELDS,
	toDateTimeInput,
} from './formSchema';

const HOUR = 3600_000;
const END_PRESETS = [
	{ key: '1h', label: 'pollCreator.preset1h', ms: HOUR },
	{ key: '24h', label: 'pollCreator.preset24h', ms: 24 * HOUR },
	{ key: '3d', label: 'pollCreator.preset3d', ms: 3 * 24 * HOUR },
	{ key: '1w', label: 'pollCreator.preset1w', ms: 7 * 24 * HOUR },
] as const;
const STEP_LABELS = ['pollCreator.stepQuestion', 'pollCreator.stepOptions', 'pollCreator.stepTiming'];
const LAST_STEP = STEP_LABELS.length - 1;

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

export function PollCreator({
	triggerChildren,
	poll,
	draft,
	open: openProp,
	onOpenChange,
	onSaved,
}: PollCreatorProps) {
	const { t } = useLanguage();
	const router = useRouter();
	const isEdit = !!poll;
	const [internalOpen, setInternalOpen] = useState(false);
	const open = openProp ?? internalOpen;
	// Built once: they read the clock, and useForm only needs the first value
	const [defaults] = useState(() => initialValues(poll, draft));
	const initialPreset = isEdit || draft ? null : '3d';
	const [step, setStep] = useState(0);
	const [endPreset, setEndPreset] = useState<string | null>(initialPreset);
	const [showSaveDraftAlert, setShowSaveDraftAlert] = useState(false);

	const {
		register,
		control,
		handleSubmit,
		trigger,
		reset,
		getValues,
		setValue,
		setError,
		formState: { errors, isDirty, isSubmitting },
	} = useForm({
		resolver: zodResolver(pollFormSchema),
		defaultValues: defaults,
	});
	const { fields, append, remove } = useFieldArray({ control, name: 'options' });
	const title = useWatch({ control, name: 'title' });
	const options = useWatch({ control, name: 'options' });

	const setOpen = (value: boolean) => {
		setInternalOpen(value);
		onOpenChange?.(value);
	};

	const close = () => {
		reset(initialValues(poll, draft));
		setStep(0);
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

	const next = async () => {
		if (await trigger([...STEP_FIELDS[step]])) setStep((current) => current + 1);
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
		// Jump back to the first step with an error
		(invalid) => {
			const firstInvalid = STEP_FIELDS.findIndex((fieldNames) =>
				fieldNames.some((name) => name in invalid)
			);
			if (firstInvalid !== -1) setStep(firstInvalid);
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
		message ? <p className="text-xs text-destructive">{t(message)}</p> : null;

	const canAddOption = options.every((option) => option.text.trim());

	let backAction: ReactNode = <span />;
	if (step > 0) {
		backAction = (
			<Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
				{t('pollCreator.back')}
			</Button>
		);
	} else if (!isEdit) {
		backAction = (
			<Button type="button" variant="ghost" onClick={handleSaveDraft}>
				{t('pollCreator.saveDraftLabel')}
			</Button>
		);
	}

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				{!isEdit && (
					<DialogTrigger render={triggerChildren}>
						{!triggerChildren && <Plus />}
					</DialogTrigger>
				)}
				<DialogContent className="sm:max-w-lg overflow-y-scroll max-h-[96vh] no-scrollbar">
					<DialogHeader>
						<DialogTitle>{t(isEdit ? 'pollCreator.editTitle' : 'pollCreator.title')}</DialogTitle>
						<DialogDescription>
							{t(isEdit ? 'pollCreator.editSubtitle' : 'pollCreator.subtitle')}
						</DialogDescription>
					</DialogHeader>

					<ol className="flex flex-wrap gap-1.5 font-mono text-xs text-muted-foreground">
						{STEP_LABELS.map((label, i) => (
							<li
								key={label}
								aria-current={i === step ? 'step' : undefined}
								className={cn(
									'rounded-full border border-border px-2.5 py-1',
									i === step && 'border-foreground text-foreground'
								)}
							>
								{i + 1} {t(label)}
							</li>
						))}
					</ol>

					<form
						noValidate
						className="space-y-6"
						onSubmit={(e) => {
							if (step < LAST_STEP) {
								e.preventDefault();
								next();
							} else {
								publish(e);
							}
						}}
					>
						{step === 0 && (
							<div className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="title">{t('pollCreator.questionLabel')}</Label>
									<Textarea
										id="title"
										placeholder={t('pollCreator.questionPlaceholder')}
										className="min-h-[80px] resize-none"
										maxLength={POLL_TITLE_MAX}
										aria-invalid={!!errors.title}
										{...register('title')}
									/>
									<div className="flex justify-between items-center text-xs text-muted-foreground">
										<span>{t('pollCreator.questionNote')}</span>
										<span className="tabular-nums">
											{title.length}/{POLL_TITLE_MAX}
										</span>
									</div>
									{errorText(errors.title?.message)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">
										{t('pollCreator.descriptionLabel')} ({t('common.optional')})
									</Label>
									<Textarea
										id="description"
										placeholder={t('pollCreator.descriptionPlaceholder')}
										className="min-h-[80px] resize-none"
										{...register('description')}
									/>
								</div>
							</div>
						)}

						{step === 1 && (
							<fieldset className="space-y-3">
								<legend className="mb-3 text-sm font-medium">
									{t('pollCreator.pollOptionsLabel')}
								</legend>
								{fields.map((field, index) => (
									<div key={field.id} className="space-y-1">
										<div className="flex items-center gap-2">
											<Input
												aria-label={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
												placeholder={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
												maxLength={POLL_OPTION_MAX}
												aria-invalid={!!errors.options?.[index]?.text}
												{...register(`options.${index}.text`)}
											/>
											{fields.length > POLL_OPTIONS_MIN && (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													aria-label={t('pollCreator.removeOption')}
													onClick={() => remove(index)}
													className="text-muted-foreground hover:text-destructive"
												>
													<X className="h-4 w-4" />
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
										size="sm"
										onClick={() => append({ text: '' })}
										className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary bg-transparent"
										disabled={!canAddOption}
									>
										<Plus className="h-4 w-4 mr-2" />
										{t('pollCreator.addOptionLabel')}
									</Button>
								)}
							</fieldset>
						)}

						{step === 2 && (
							<div className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="startTime">{t('pollCreator.opensLabel')}</Label>
									<Input id="startTime" type="datetime-local" {...register('startTime')} />
									<p className="text-xs text-muted-foreground">{t('pollCreator.opensHint')}</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="endTime">{t('pollCreator.endsLabel')}</Label>
									<Input
										id="endTime"
										type="datetime-local"
										aria-invalid={!!errors.endTime}
										{...register('endTime', { onChange: () => setEndPreset(null) })}
									/>
									<div className="flex flex-wrap gap-1.5">
										{END_PRESETS.map(({ key, label, ms }) => (
											<Button
												key={key}
												type="button"
												size="xs"
												variant={endPreset === key ? 'default' : 'secondary'}
												aria-pressed={endPreset === key}
												onClick={() => applyPreset(key, ms)}
											>
												{t(label)}
											</Button>
										))}
									</div>
									{errorText(errors.endTime?.message)}
								</div>

								<fieldset className="space-y-1.5">
									<legend className="mb-2 text-sm font-medium">
										{t('pollCreator.visibilityLabel')}
									</legend>
									{VoterVisibilitySchema.options.map((level) => (
										<label
											key={level}
											className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] has-[:checked]:border-primary"
										>
											<input
												type="radio"
												value={level}
												className="mt-0.5 accent-primary"
												{...register('voterVisibility')}
											/>
											<span>
												{t(`pollCreator.visibility.${level}`)}
												<small className="block text-xs text-muted-foreground">
													{t(`pollCreator.visibility.${level}Hint`)}
												</small>
											</span>
										</label>
									))}
									<p className="pt-1 text-xs text-muted-foreground">
										{t('pollCreator.visibilityNote')}
									</p>
								</fieldset>
							</div>
						)}

						{errors.root?.message && (
							<p role="alert" className="text-sm text-destructive">
								{errors.root.message}
							</p>
						)}

						<div className="flex items-center justify-between gap-3">
							{backAction}
							{step < LAST_STEP ? (
								<Button type="submit">{t('pollCreator.next')}</Button>
							) : (
								<ButtonLoading type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
									{t(isEdit ? 'pollCreator.saveChanges' : 'pollCreator.publish')}
								</ButtonLoading>
							)}
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
