import { appConfig, getActiveServerIdentity } from '../config';
import type {
	BootstrapResolveRequest,
	BootstrapResolveResponse,
} from '../types/device';

const normalizeOrigin = (value: string) => {
	if (!value) {
		return '';
	}

	const candidate = /^https?:\/\//i.test(value) ? value : `http://${value}`;
	try {
		const parsed = new URL(candidate);
		return `${parsed.protocol}//${parsed.host}`;
	} catch {
		return '';
	}
};

const withPath = (origin: string, path: string) => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${origin}${normalizedPath}`;
};

const toUniqueOrigins = (values: string[]) => {
	const seen = new Set<string>();
	const ordered: string[] = [];

	values.forEach((value) => {
		const normalized = normalizeOrigin(value);
		if (!normalized || seen.has(normalized)) {
			return;
		}
		seen.add(normalized);
		ordered.push(normalized);
	});

	return ordered;
};

const buildCandidateOrigins = () => {
	const activeIdentity = getActiveServerIdentity();
	return toUniqueOrigins([
		appConfig.bootstrapUrl,
		activeIdentity.origin,
		appConfig.apiBaseUrl,
		appConfig.displayUrl,
		...appConfig.discoveryOrigins,
	]);
};

const postWithTimeout = async <TResponse>(
	url: string,
	payload: unknown,
	timeoutMs: number
): Promise<TResponse> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Bootstrap endpoint returned ${response.status}`);
		}

		return (await response.json()) as TResponse;
	} finally {
		clearTimeout(timeout);
	}
};

export const discoverBootstrapServer = async (
	request: BootstrapResolveRequest
): Promise<BootstrapResolveResponse | null> => {
	const candidates = buildCandidateOrigins();
	if (!candidates.length) {
		return null;
	}

	for (const origin of candidates) {
		try {
			const resolved = await postWithTimeout<BootstrapResolveResponse>(
				withPath(origin, appConfig.bootstrapResolvePath),
				{
					...request,
					currentOrigin: getActiveServerIdentity().origin,
				},
				appConfig.bootstrapTimeoutMs
			);

			if (resolved?.server?.origin) {
				return resolved;
			}
		} catch {
			// Keep iterating candidates; bootstrap discovery is best-effort.
		}
	}

	return null;
};

