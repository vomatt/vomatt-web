'use client';

import { BarChart3, Clock, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

interface PollOption {
	id: string;
	text: string;
}

export function PollCreator() {
	const [question, setQuestion] = useState('');
	const [options, setOptions] = useState<PollOption[]>([
		{ id: '1', text: '' },
		{ id: '2', text: '' },
	]);
	const [duration, setDuration] = useState('1');
	const [showPreview, setShowPreview] = useState(false);

	const addOption = () => {
		if (options.length < 4) {
			setOptions([...options, { id: Date.now().toString(), text: '' }]);
		}
	};

	const removeOption = (id: string) => {
		if (options.length > 2) {
			setOptions(options.filter((option) => option.id !== id));
		}
	};

	const updateOption = (id: string, text: string) => {
		setOptions(
			options.map((option) => (option.id === id ? { ...option, text } : option))
		);
	};

	const handleCreatePoll = () => {
		// Handle poll creation logic here
		console.log('Creating poll:', { question, options, duration });
	};

	const isValid =
		question.trim() &&
		options.every((opt) => opt.text.trim()) &&
		options.length >= 2;

	return (
		<div className="space-y-6">
			{/* Main Creation Form */}

			<div className="space-y-6">
				{/* Question Input */}
				<div className="space-y-2">
					<Label
						htmlFor="question"
						className="text-sm font-medium text-card-foreground"
					>
						What would you like to ask?
					</Label>
					<Textarea
						id="question"
						placeholder="Ask a question to start a discussion..."
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						className="min-h-[80px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
						maxLength={280}
					/>
					<div className="flex justify-between items-center text-xs text-muted-foreground">
						<span>Make it engaging and clear</span>
						<span>{question.length}/280</span>
					</div>
				</div>

				{/* Poll Options */}
				<div className="space-y-3">
					<Label className="text-sm font-medium text-card-foreground">
						Poll Options
					</Label>
					{options.map((option, index) => (
						<div key={option.id} className="flex items-center gap-2">
							<div className="flex-1">
								<Input
									placeholder={`Option ${index + 1}`}
									value={option.text}
									onChange={(e) => updateOption(option.id, e.target.value)}
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

					{options.length < 4 && (
						<Button
							variant="outline"
							size="sm"
							onClick={addOption}
							className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary bg-transparent"
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Option
						</Button>
					)}
				</div>

				{/* Duration Selector */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
						<Clock className="h-4 w-4" />
						Poll Duration
					</Label>
					<Select value={duration} onValueChange={setDuration}>
						<SelectTrigger className="bg-input border-border text-foreground">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1">1 day</SelectItem>
							<SelectItem value="3">3 days</SelectItem>
							<SelectItem value="7">1 week</SelectItem>
							<SelectItem value="30">1 month</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Preview Section */}
			{question && options.some((opt) => opt.text.trim()) && (
				<Card className="border-border bg-card">
					<CardHeader>
						<CardTitle className="text-card-foreground">Preview</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<h3 className="font-medium text-card-foreground text-pretty">
									{question}
								</h3>
							</div>
							<div className="space-y-2">
								{options
									.filter((opt) => opt.text.trim())
									.map((option, index) => (
										<div
											key={option.id}
											className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
										>
											<span className="text-sm text-muted-foreground">
												{option.text}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-12 h-2 bg-border rounded-full">
													<div className="w-0 h-full bg-primary rounded-full transition-all" />
												</div>
												<span className="text-xs text-muted-foreground">
													0%
												</span>
											</div>
										</div>
									))}
							</div>
							<div className="flex items-center gap-4 text-xs text-muted-foreground">
								<div className="flex items-center gap-1">
									<Users className="h-3 w-3" />
									<span>0 votes</span>
								</div>
								<div className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									<span>
										{duration} day{duration !== '1' ? 's' : ''} left
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Action Buttons */}
			<div className="flex gap-3">
				<Button
					onClick={handleCreatePoll}
					disabled={!isValid}
					className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
				>
					Create Poll
				</Button>
				<Button
					variant="outline"
					className="border-border text-muted-foreground hover:text-foreground bg-transparent"
				>
					Save Draft
				</Button>
			</div>

			{/* Tips */}
			<Card className="border-border bg-muted/30 hidden">
				<CardContent className="pt-6">
					<div className="space-y-2">
						<h4 className="font-medium text-sm text-card-foreground">
							💡 Tips for great polls
						</h4>
						<ul className="text-xs text-muted-foreground space-y-1">
							<li>• Keep your question clear and specific</li>
							<li>• Provide balanced and distinct options</li>
							<li>• Consider your audience when setting duration</li>
							<li>• Engage with voters in the comments</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
