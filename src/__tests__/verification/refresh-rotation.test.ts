/**
 * @jest-environment node
 */
// Bounded model check of refresh-token rotation through the real proxy.
// What it proves and how to read a failure: .claude/skills/verify-refresh-rotation/SKILL.md
import { AsyncLocalStorage } from 'node:async_hooks';

import type { NextRequest } from 'next/server';

process.env.API_URL = 'http://api.verify.test';
process.env.SESSION_SECRET = 'model-check-secret-0123456789abcdef';

// ── Bounds ───────────────────────────────────────────────────────────────────
// One browser request per path, issued in this order. REFRESH_CHECK_DEEP=1 adds a fourth (~3 min).
const PATHS = ['/', '/my-polls', '/login', ...(process.env.REFRESH_CHECK_DEEP ? ['/'] : [])];
const INSTANCES = 2; // server instances, each with its own in-flight refresh map
const MAX_AGES = 1; // times the clock jumps (access tokens age, grace windows close)
const MAX_FAULTS = 1; // refresh calls the backend may refuse with 429 before processing

// ── World: browser cookie jar + vomatt-api RefreshTokenService ───────────────
type Pending =
	| { kind: 'verify'; req: number; resolve: (v: unknown) => void }
	| { kind: 'backend'; req: number; inst: number; token: string; resolve: (v: unknown) => void };

type Req = {
	id: number;
	path: string;
	inst: number;
	cookies: { accessToken?: string; refreshToken?: string };
	phase: 'running' | 'settled' | 'delivered';
	verifies: number;
	response?: Response;
};

type TokenState = { state: 'live' } | { state: 'consumed'; pair: [string, string]; grace: boolean };

class World {
	jar: { accessToken?: string; refreshToken?: string } = { accessToken: 'A0', refreshToken: 'R0' };
	refresh = new Map<string, TokenState>([['R0', { state: 'live' }]]);
	access = new Map<string, number>([['A0', -1]]); // token → epoch issued
	head = 'R0'; // the session's live refresh token
	revoked = false;
	epoch = 0;
	ages = 0;
	faults = 0;
	issued = 0;
	next = 1;
	reqs: Req[] = [];
	pending: Pending[] = [];
	violations: string[] = [];
	story: string[] = [];

	/** vomatt-api RefreshTokenService: rotate, grace window, reuse detection. */
	backendRefresh(token: string) {
		const record = this.refresh.get(token);
		if (this.revoked || !record) {
			return { status: 401, body: { success: false, errorCode: 'auth.refresh_token.invalid' } };
		}
		if (record.state === 'consumed' && !record.grace) {
			this.revoked = true;
			this.violations.push(
				`P2: backend saw consumed ${token} after its grace window and signed the session out`
			);
			return { status: 401, body: { success: false, errorCode: 'auth.suspicious_login' } };
		}
		let pair: [string, string];
		if (record.state === 'consumed') {
			pair = record.pair;
		} else {
			pair = [`A${this.next}`, `R${this.next}`];
			this.next++;
			this.refresh.set(token, { state: 'consumed', pair, grace: true });
			this.refresh.set(pair[1], { state: 'live' });
			this.access.set(pair[0], this.epoch);
			this.head = pair[1];
		}
		return { status: 200, body: { success: true, data: { token: pair[0], refreshToken: pair[1] } } };
	}

	/** verifyAccessToken's answer: fresh in its epoch, expiring the next, then expired. */
	payloadFor(token: string) {
		const issued = this.access.get(token);
		if (issued === undefined || this.epoch - issued > 1) return null;
		const secondsLeft = this.epoch === issued ? 900 : 30;
		return { sub: 'user-1', exp: Math.floor(Date.now() / 1000) + secondsLeft };
	}
}

const als = new AsyncLocalStorage<{ world: World; req: number }>();
const ctx = () => {
	const store = als.getStore();
	if (!store) throw new Error('model error: mocked call outside a proxy run');
	return store;
};

jest.mock('@/lib/api/backend-fetch', () => ({
	backendFetch: (_url: string, init: RequestInit) => {
		const { world, req } = ctx();
		const token = JSON.parse(String(init.body)).refreshToken as string;
		const inst = world.reqs[req].inst;
		if (world.pending.some((p) => p.kind === 'backend' && p.inst === inst && p.token === token)) {
			world.violations.push(
				`P1: instance ${inst + 1} sent ${token} again while its first refresh was still in flight`
			);
		}
		return new Promise((resolve) => world.pending.push({ kind: 'backend', req, inst, token, resolve }));
	},
}));

jest.mock('@/lib/api/tokens', () => {
	const actual = jest.requireActual('@/lib/api/tokens');
	return {
		...actual,
		verifyAccessToken: (token: string) => {
			const { world, req } = ctx();
			const r = world.reqs[req];
			r.verifies++;
			// The check after a refresh touches no shared state before the response,
			// so it is not a scheduling point.
			if (r.verifies > 1) return Promise.resolve(world.payloadFor(token));
			return new Promise((resolve) => world.pending.push({ kind: 'verify', req, resolve }));
		},
	};
});

// One proxy module per server instance, so each has its own in-flight map
type ProxyFn = (req: NextRequest) => Promise<Response>;
const instances: { proxy: ProxyFn; NextRequest: typeof import('next/server').NextRequest }[] = [];
for (let i = 0; i < INSTANCES; i++) {
	jest.isolateModules(() => {
		instances.push({ proxy: require('@/proxy').proxy, NextRequest: require('next/server').NextRequest });
	});
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function fakeResponse({ status, body }: { status: number; body: unknown }) {
	return { status, ok: status >= 200 && status < 300, json: async () => body };
}

// ── Choices ──────────────────────────────────────────────────────────────────
function choices(w: World): string[] {
	const out: string[] = [];
	if (w.issued < PATHS.length) {
		const insts = w.issued === 0 ? 1 : INSTANCES; // the first request's instance is symmetric
		for (let i = 0; i < insts; i++) out.push(`issue:${i}`);
	}
	for (const p of w.pending) {
		if (p.kind === 'verify') out.push(`verify:${p.req}`);
		else {
			out.push(`backend:${p.req}:ok`);
			if (w.faults < MAX_FAULTS) out.push(`backend:${p.req}:429`);
		}
	}
	for (const r of w.reqs) if (r.phase === 'settled') out.push(`deliver:${r.id}`);
	const quiet = w.pending.length === 0 && w.reqs.every((r) => r.phase === 'delivered');
	// Assumption: the clock only jumps when nothing is in flight (requests finish within the grace window)
	if (quiet && w.ages < MAX_AGES && w.issued < PATHS.length) out.push('age');
	return out;
}

const label = (w: World, id: number) => `request ${id + 1} (${w.reqs[id].path}, instance ${w.reqs[id].inst + 1})`;

async function apply(w: World, choice: string) {
	const [kind, a, b] = choice.split(':');
	if (kind === 'issue') {
		const id = w.issued++;
		const cookies = { ...w.jar };
		const r: Req = { id, path: PATHS[id], inst: Number(a), cookies, phase: 'running', verifies: 0 };
		w.reqs.push(r);
		const header = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
		const { proxy, NextRequest } = instances[r.inst];
		w.story.push(`browser sends ${label(w, id)} with ${cookies.accessToken ?? '-'}/${cookies.refreshToken ?? '-'}`);
		als.run({ world: w, req: id }, () =>
			proxy(new NextRequest(`http://localhost:3102${r.path}`, { headers: header ? { cookie: header } : {} }))
		).then((res) => {
			r.response = res;
			r.phase = 'settled';
		});
	} else if (kind === 'verify' || kind === 'backend') {
		const id = Number(a);
		const i = w.pending.findIndex((p) => p.kind === kind && p.req === id);
		const [p] = w.pending.splice(i, 1);
		if (p.kind === 'verify') {
			w.story.push(`${label(w, id)} finishes verifying its access token`);
			p.resolve(w.payloadFor(w.reqs[id].cookies.accessToken ?? ''));
		} else if (b === '429') {
			w.faults++;
			w.story.push(`backend answers 429 to ${label(w, id)}'s refresh of ${p.token} (not processed)`);
			p.resolve(fakeResponse({ status: 429, body: { success: false } }));
		} else {
			const reply = w.backendRefresh(p.token);
			const what = reply.status === 200 ? (reply.body as any).data.refreshToken : (reply.body as any).errorCode;
			w.story.push(`backend refreshes ${p.token} for ${label(w, id)} → ${what}`);
			p.resolve(fakeResponse(reply));
		}
	} else if (kind === 'deliver') {
		const r = w.reqs[Number(a)];
		r.phase = 'delivered';
		const set: string[] = [];
		for (const c of (r.response as any).cookies.getAll()) {
			if (c.name !== 'accessToken' && c.name !== 'refreshToken') continue;
			if (c.value === '') delete w.jar[c.name as 'accessToken'];
			else w.jar[c.name as 'accessToken'] = c.value;
			set.push(`${c.name}=${c.value || '(deleted)'}`);
		}
		w.story.push(`browser receives ${label(w, r.id)}'s response${set.length ? `, sets ${set.join(', ')}` : ''}`);
	} else if (kind === 'age') {
		w.epoch++;
		w.ages++;
		for (const [t, s] of w.refresh) if (s.state === 'consumed') w.refresh.set(t, { ...s, grace: false });
		w.story.push('time passes: access tokens near expiry, grace windows close');
	}
	await flush();
	await flush();
	checkBlocked(w);
}

/** Every running request must be waiting on something the scheduler controls. */
function checkBlocked(w: World) {
	for (const r of w.reqs) {
		if (r.phase !== 'running') continue;
		const own = w.pending.some((p) => p.req === r.id);
		const shared = w.pending.some(
			(p) => p.kind === 'backend' && p.inst === r.inst && p.token === r.cookies.refreshToken
		);
		if (!own && !shared) throw new Error(`model error: ${label(w, r.id)} is stuck on an await the model does not control`);
	}
}

function key(w: World) {
	return JSON.stringify([
		w.jar, [...w.refresh], [...w.access], w.head, w.revoked, w.epoch, w.ages, w.faults, w.issued,
		w.reqs.map((r) => [r.inst, r.cookies, r.phase, w.pending.filter((p) => p.req === r.id).map((p) => p.kind)]),
		w.violations.length,
	]);
}

// Settle whatever a run left pending, so its in-flight map entries are gone before the next run
async function drain(w: World) {
	for (let i = 0; i < 20 && (w.pending.length || w.reqs.some((r) => r.phase === 'running')); i++) {
		for (const p of w.pending.splice(0)) {
			p.resolve(p.kind === 'verify' ? null : fakeResponse({ status: 429, body: {} }));
		}
		await flush();
	}
	if (w.pending.length || w.reqs.some((r) => r.phase === 'running')) throw new Error('model error: drain did not settle');
}

let live: World | undefined;
async function replay(prefix: string[]) {
	if (live) await drain(live);
	const w = new World();
	live = w;
	for (const c of prefix) await apply(w, c);
	return w;
}

async function explore() {
	const seen = new Set<string>();
	const stack: string[][] = [[]];
	let terminals = 0;
	while (stack.length) {
		const prefix = stack.pop()!;
		const w = await replay(prefix);
		if (w.violations.length) return { violation: w.violations[0], story: w.story, states: seen.size, terminals };
		const k = key(w);
		if (seen.has(k)) continue;
		seen.add(k);
		const next = choices(w);
		if (next.length === 0) {
			terminals++;
			if (w.jar.refreshToken !== w.head) {
				return {
					violation: `P3: browser ended with refresh token ${w.jar.refreshToken ?? '(none)'}, but the live one is ${w.head}`,
					story: w.story,
					states: seen.size,
					terminals,
				};
			}
			continue;
		}
		for (const c of next.reverse()) stack.push([...prefix, c]);
	}
	if (live) await drain(live);
	return { violation: undefined, story: [], states: seen.size, terminals };
}

describe('refresh-token rotation (bounded model check)', () => {
	it('never revokes the session or strands the browser on a spent token', async () => {
		const result = await explore();
		const report = result.violation
			? `${result.violation}\nCounterexample:\n${result.story.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`
			: `ok: ${result.states} states, ${result.terminals} end states`;
		console.log(`refresh-rotation: ${report}`);
		expect(result.violation).toBeUndefined();
	}, 600_000);
});
