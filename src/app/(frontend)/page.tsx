import NextLink from 'next/link';

import { CreateVoteDialog } from '@/components/CreateVoteDialog';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrentUser } from '@/data/auth';

import { FeedList } from './_components/FeedList';
// export async function generateMetadata({}) {}
// const { t } = useLanguage();
const fakeData = [
	{
		title:
			'您是否同意中油第三天然氣接收站遷離桃園大潭藻礁海岸及海域？（即北起觀音溪出海口，南至新屋溪出海口之海岸，及由上述海岸最低潮線往外平行延伸五公里之海域）',
		description: 'Description',
	},
	{
		title:
			'你是否同意公民投票案公告成立後半年內，若該期間內遇有全國性選舉時，在符合公民投票法規定之情形下，公民投票應與該選舉同日舉行？',
		description: 'Description',
	},
	{
		title:
			'你是否同意政府應全面禁止進口含有萊克多巴胺之乙型受體素豬隻之肉品、內臟及其相關產製品？',
		description: 'Description',
	},
];

export default async function Page() {
	const user = await getCurrentUser();

	return (
		<div className="px-contain">
			<div className="flex justify-between gap-10">
				<FeedList data={fakeData} className="" />
				{!user && (
					<div className="bg-secondary text-secondary-foreground rounded-lg p-6 h-fit text-center max-w-sm hidden lg:block">
						<h4 className="text-white font-bold text-2xl">
							Log in or sign up for Vomatt
						</h4>
						<p className="text-gray mt-2">
							See what people are talking about and join the conversation.
						</p>
						<Button asChild className="mt-5">
							<NextLink href="/login">Log in</NextLink>
						</Button>
					</div>
				)}
				<CreateVoteDialog triggerClassName="fixed bottom-contain right-contain size-14 flex justify-center items-center bg-secondary rounded-xl cursor-pointer hover:scale-120 transition-all hover:bg-secondary/90" />
			</div>
		</div>
	);
}
