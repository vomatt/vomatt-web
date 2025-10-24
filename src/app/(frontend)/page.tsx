import { getPollsData } from '@/app/api/get-polls/getPollsData';
import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';

import { PollFeedList } from './_components/PollFeedList';
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

	return (
		<div className="px-contain flex justify-center gap-10">
			<PollFeedList data={data} />
			{!user && <LoginPrompt className="sticky top-14" />}
		</div>
	);
}
