import { getPollsData } from '@/app/api/get-polls/getPollsData';
import { LoginPrompt } from '@/components/LoginPrompt';
import { PollCreator } from '@/components/PollCreator';
import { getUserSession } from '@/data/auth';

import { FeedList } from './_components/FeedList';
// export async function generateMetadata({}) {}

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
	const user = await getUserSession();
	const data = await getPollsData();
	console.log('🚀 ~ :30 ~ Page ~ data:', data);

	return (
		<div className="px-contain">
			<div className="flex justify-between gap-10">
				<FeedList data={data} className="mx-auto" />
				{!user && <LoginPrompt />}
				<PollCreator triggerClassName="fixed bottom-contain right-contain size-14 flex justify-center items-center bg-secondary rounded-xl cursor-pointer hover:scale-120 transition-all hover:bg-secondary/90" />
			</div>
		</div>
	);
}
