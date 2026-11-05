import { serializeJsonLd } from '@/lib/structuredData';

export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
	if (!data) return null;
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
