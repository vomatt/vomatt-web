'use client';
import { Calendar, Plus, X } from '@/components/ui/SvgIcons';
import { ReactNode, useCallback, useEffect, useState } from 'react';

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
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { createPoll } from '@/lib/api/services/polls';
import { PollCreateOption, PollPrivacyMode } from '@/types/poll';

interface PollCreatorProps {
	triggerChildren?: ReactNode;
}

export function PollCreator({ triggerChildren }: PollCreatorProps) {
	const optionsLimit = 10;
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [question, setQuestion] = useState('');
	const [description, setDescription] = useState('');
	const [options, setOptions] = useState<PollCreateOption[]>([
		{ id: 'option-1', text: '' },
		{ id: 'option-2', text: '' },
	]);

	const [isAllowMultipleChoices, setIsAllowMultipleChoices] = useState(false);
	const [startTime, setStartTime] = useState('');
	const [endTime, setEndTime] = useState('');
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [privacyMode, setPrivacyMode] = useState<PollPrivacyMode>('public');
	const [inviteInput, setInviteInput] = useState('');
	const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

	const [showSaveDraftAlert, setShowSaveDraftAlert] = useState(false);
	const [error, setError] = useState('');

	const resetForm = () => {
		setQuestion('');
		setDescription('');
		setOptions([
			{ id: 'option-1', text: '' },
			{ id: 'option-2', text: '' },
		]);
		setIsAllowMultipleChoices(false);
		setStartTime('');
		setEndTime('');
		setIsAnonymous(false);
		setPrivacyMode('public');
		setInviteInput('');
		setInvitedUsers([]);
	};

	const addOption = () => {
		setOptions([...options, { id: Date.now().toString(), text: '' }]);
	};

	const removeOption = (id: string) => {
		setOptions(options.filter((option) => option.id !== id));
	};

	const addInvitedUser = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed || invitedUsers.includes(trimmed)) return;
		setInvitedUsers([...invitedUsers, trimmed]);
		setInviteInput('');
	};
	const removeInvitedUser = (value: string) =>
		setInvitedUsers(invitedUsers.filter((u) => u !== value));
	const handleInviteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addInvitedUser(inviteInput);
		}
		if (e.key === 'Backspace' && inviteInput === '' && invitedUsers.length > 0)
			removeInvitedUser(invitedUsers[invitedUsers.length - 1]);
	};

	const updateOption = (id: string, text: string) => {
		setOptions(
			options.map((option) => (option.id === id ? { ...option, text } : option))
		);
	};

	const hasUnsavedData = useCallback(() => {
		return (
			question.trim() !== '' ||
			description.trim() !== '' ||
			options.some((opt) => opt.text.trim() !== '')
		);
	}, [question, description, options]);

	// Handle browser close/refresh
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedData()) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedData]);

	// Handle modal/page close
	const handleClose = () => {
		if (hasUnsavedData()) {
			setShowSaveDraftAlert(true);
		} else {
			setOpen(false);
		}
	};

	const onHandleOpenChange = (value: boolean) => {
		if (value === false) {
			handleClose();
			return;
		}
		setOpen(value);
	};

	const handleSaveDraft = async () => {
		const draft = {
			question,
			description,
			options,
			startTime,
			endTime,
			isAllowMultipleChoices,
			isAnonymous,
			privacyMode,
			invitedUsers,
		};

		// Persist locally immediately for recovery
		try {
			localStorage.setItem('vomatt_poll_draft', JSON.stringify(draft));
		} catch {
			// ignore storage errors
		}

		resetForm();
	};

	const handleCreatePoll = async () => {
		setIsLoading(true);
		const now = new Date();
		const currentTime = now.toISOString().slice(0, 16); // Slice to get YYYY-MM-DDTHH:mm

		const body = {
			question,
			description,
			options,
			startTime: startTime || currentTime,
			endTime,
			isAllowMultipleChoices,
			isAnonymous,
			privacyMode,
			invitedUsers,
		};

		try {
			const data = await createPoll(body);

			if (data?.status === 'SUCCESS') {
				resetForm();
				setOpen(false);
				return;
			}

			setError(data?.message ?? 'error');
		} catch (error) {
			setError('error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfirmSaveDraft = async () => {
		await handleSaveDraft();
		setShowSaveDraftAlert(false);
		setOpen(false);
	};

	const handleDiscardDraft = () => {
		setShowSaveDraftAlert(false);
		setOpen(false);
	};

	const isValid =
		question.trim() &&
		options.every((opt) => opt.text.trim()) &&
		options.length >= 2 &&
		(privacyMode !== 'invite-only' || invitedUsers.length > 0);

	const enableToAddMoreOption = options.every((opt) => opt.text.trim());

	return (
		<>
			<Dialog open={open} onOpenChange={onHandleOpenChange}>
				<DialogTrigger asChild={!!triggerChildren}>
					{triggerChildren ? triggerChildren : <Plus />}
				</DialogTrigger>
				<DialogContent className="sm:max-w-lg overflow-y-scroll max-h-[96vh] no-scrollbar">
					<DialogHeader>
						<DialogTitle>{t('pollCreator.title')}</DialogTitle>
						<DialogDescription>{t('pollCreator.subtitle')}</DialogDescription>
					</DialogHeader>
					<div className="space-y-10">
						<div className="space-y-6">
							<div className="space-y-2">
								<Label
									htmlFor="question"
									className="text-sm font-medium text-card-foreground"
								>
									{t('pollCreator.questionLabel')}
								</Label>
								<Textarea
									id="question"
									placeholder={t('pollCreator.questionPlaceholder')}
									value={question}
									onChange={(e) => setQuestion(e.target.value)}
									className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
									maxLength={280}
								/>
								<div className="flex justify-between items-center text-xs text-muted-foreground">
									<span>{t('pollCreator.questionNote')}</span>
									<span>{question.length}/280</span>
								</div>
							</div>
							<div className="space-y-2">
								<Label
									htmlFor="description"
									className="text-sm font-medium text-card-foreground"
								>
									{t('pollCreator.descriptionLabel')}
								</Label>
								<Textarea
									id="description"
									placeholder={t('pollCreator.descriptionPlaceholder')}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
								/>
							</div>
							<div className="space-y-3">
								<Label
									htmlFor={`options-${options[0].id}`}
									className="text-sm font-medium text-card-foreground"
								>
									{t('pollCreator.pollOptionsLabel')}
								</Label>
								{options.map((option, index) => (
									<div key={option.id} className="flex items-center gap-2">
										<div className="flex-1">
											<Input
												id={`options-${option.id}`}
												placeholder={`${t('pollCreator.optionsPlaceholder')} ${index + 1}`}
												value={option.text}
												onChange={(e) =>
													updateOption(option.id, e.target.value)
												}
												className="bg-input border-border text-foreground placeholder:text-muted-foreground"
												maxLength={100}
											/>
										</div>
										{options.length > 2 && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeOption(option.id)}
												className="text-muted-foreground hover:text-destructive"
											>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}

								{options.length < optionsLimit && (
									<Button
										variant="outline"
										size="sm"
										onClick={addOption}
										className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary bg-transparent"
										disabled={!enableToAddMoreOption}
									>
										<Plus className="h-4 w-4 mr-2" />
										{t('pollCreator.addOptionLabel')}
									</Button>
								)}
							</div>
							<div className="flex gap-5">
								<div className="space-y-2">
									<Label htmlFor="startTime" className="text-sm font-medium">
										<Calendar className="w-4 h-4" />
										{t('pollCreator.startDateLabel')}
									</Label>
									<Input
										id="startTime"
										type="datetime-local"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
										// defaultValue={Date.now()}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="endTime" className="text-sm font-medium">
										<Calendar className="w-4 h-4" />
										{t('pollCreator.startDateLabel')} ({t('common.optional')})
									</Label>
									<Input
										id="endTime"
										type="datetime-local"
										value={endTime}
										onChange={(e) => setEndTime(e.target.value)}
									/>
								</div>
							</div>

							<div className="flex items-center gap-5">
								<div className="flex items-center space-x-2">
									<Label
										htmlFor="allowMultiple"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
									>
										{t('pollCreator.allowMultipleChoicesLabel')}
									</Label>
									<Switch
										id="allowMultiple"
										checked={isAllowMultipleChoices}
										onCheckedChange={(checked) =>
											setIsAllowMultipleChoices(checked as boolean)
										}
									/>

									<div className="flex items-center space-x-2">
										<Label
											htmlFor="anonymous"
											className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
										>
											{t('pollCreator.anonymousVotingLabel')}
										</Label>
										<Switch
											id="anonymous"
											checked={isAnonymous}
											onCheckedChange={(checked) =>
												setIsAnonymous(checked as boolean)
											}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Privacy section */}
						<div className="space-y-2">
							<Label className="text-sm font-medium text-card-foreground">
								{t('pollCreator.privacyLabel')}
							</Label>
							<div className="flex gap-2">
								{(
									['public', 'link-only', 'invite-only'] as PollPrivacyMode[]
								).map((mode) => (
									<Button
										key={mode}
										type="button"
										size="sm"
										variant={privacyMode === mode ? 'default' : 'outline'}
										onClick={() => setPrivacyMode(mode)}
										className={cn(
											privacyMode !== mode &&
												'border-border text-muted-foreground bg-transparent'
										)}
									>
										{mode === 'public' && t('pollCreator.privacyPublic')}
										{mode === 'link-only' && t('pollCreator.privacyLinkOnly')}
										{mode === 'invite-only' &&
											t('pollCreator.privacyInviteOnly')}
									</Button>
								))}
							</div>
							<p className="text-xs text-muted-foreground">
								{privacyMode === 'public' && t('pollCreator.privacyPublicHint')}
								{privacyMode === 'link-only' &&
									t('pollCreator.privacyLinkOnlyHint')}
								{privacyMode === 'invite-only' &&
									t('pollCreator.privacyInviteOnlyHint')}
							</p>
							{privacyMode === 'invite-only' && (
								<div className="space-y-2">
									<Label className="text-sm font-medium text-card-foreground">
										{t('pollCreator.inviteUsersLabel')}
									</Label>
									<div className="flex flex-wrap gap-1.5 min-h-[2.5rem] rounded-md border border-input bg-input/30 px-3 py-2 focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring">
										{invitedUsers.map((user) => (
											<span
												key={user}
												className="bg-secondary text-secondary-foreground text-xs rounded px-2 py-0.5 inline-flex items-center gap-1"
											>
												{user}
												<button
													type="button"
													onClick={() => removeInvitedUser(user)}
													className="hover:text-destructive"
												>
													<X className="h-3 w-3" />
												</button>
											</span>
										))}
										<input
											value={inviteInput}
											onChange={(e) => setInviteInput(e.target.value)}
											onKeyDown={handleInviteKeyDown}
											placeholder={
												invitedUsers.length === 0
													? t('pollCreator.inviteUsersPlaceholder')
													: ''
											}
											className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
										/>
									</div>
								</div>
							)}
						</div>
						<div className="flex gap-3">
							<ButtonLoading
								onClick={handleCreatePoll}
								className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
								disabled={!isValid || isLoading}
								isLoading={isLoading}
							>
								{t('pollCreator.createPollLabel')}
							</ButtonLoading>
							<Button
								variant="outline"
								className="border-border text-muted-foreground hover:text-foreground bg-transparent"
							>
								{t('pollCreator.saveDraftLabel')}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={showSaveDraftAlert}
				onOpenChange={setShowSaveDraftAlert}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Save to drafts?</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Would you like to save this poll as a
							draft before leaving?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleDiscardDraft}>
							Discard
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmSaveDraft}>
							Save Draft
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
