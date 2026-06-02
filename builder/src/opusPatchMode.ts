import { MAX_FILE_LINES_FOR_OVERWRITE } from './opusBridgeConfig.js';
import { outboundFetch } from './outboundHttp.js';

export type PatchEdit = { search: string; replace: string };

type GitHubContentsResponse = {
  content: string;
  sha: string;
};

type GitHubUpdateResponse = {
  commit?: {
    sha?: string;
  };
  message?: string;
};

type FetchLike = typeof outboundFetch;

export type PutFileContentMode =
  | { op: 'create'; expectedBaseSha?: string }
  | { op: 'update'; expectedBaseSha: string };

function githubContentsHeaders(token: string): Record<string, string> {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

export function applyPatches(source: string, patches: PatchEdit[]): string {
  let result = source;
  for (const p of patches) {
    if (!result.includes(p.search)) throw new Error("Not found: " + p.search.slice(0,40));
    result = result.replace(p.search, p.replace);
  }
  return result;
}

export function estimateFileComplexity(content: string): { lines: number; tooLargeForOverwrite: boolean } {
  const lines = content.split('\n').length;
  return {
    lines,
    tooLargeForOverwrite: lines > MAX_FILE_LINES_FOR_OVERWRITE,
  };
}

export async function applyPatch(
  repoOwner: string,
  repoName: string,
  filePath: string,
  patches: Array<{ search: string; replace: string }>,
  commitMessage: string,
  token: string
): Promise<{ success: boolean; commitSha?: string; error?: string }> {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const headers = githubContentsHeaders(token);

  try {
    // 1. Fetch current file content
    const getResponse = await outboundFetch(url, { headers });
    if (!getResponse.ok) {
      return { success: false, error: `Failed to fetch file: ${getResponse.statusText}` };
    }
    const fileData = await getResponse.json() as GitHubContentsResponse;
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const sha = fileData.sha;

    // 2. Apply patches
    let updatedContent = currentContent;
    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      if (!updatedContent.includes(patch.search)) {
        return {
          success: false,
          error: `Patch ${i + 1} failed: search string not found`,
        };
      }
      updatedContent = updatedContent.replace(patch.search, patch.replace);
    }

    // 3. PUT updated content
    const putBody = {
      message: commitMessage,
      content: Buffer.from(updatedContent).toString('base64'),
      sha,
    };

    const putResponse = await outboundFetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putBody),
    });

    if (!putResponse.ok) {
      const errorData = await putResponse.json().catch(() => null) as GitHubUpdateResponse | null;
      const detail = errorData?.message ? ` (${errorData.message})` : '';
      return { success: false, error: `Failed to update file: ${putResponse.statusText}${detail}` };
    }

    const result = await putResponse.json() as GitHubUpdateResponse;
    return { success: true, commitSha: result.commit?.sha };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function putFileContent(
  repoOwner: string,
  repoName: string,
  filePath: string,
  content: string,
  commitMessage: string,
  token: string,
  fetchImpl: FetchLike = outboundFetch,
  mode?: PutFileContentMode,
): Promise<{ success: boolean; commitSha?: string; error?: string }> {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const headers = githubContentsHeaders(token);

  try {
    let sha: string | undefined;
    if (mode?.op === 'update') {
      if (!mode.expectedBaseSha) {
        return { success: false, error: 'update-only put requires expectedBaseSha' };
      }
      sha = mode.expectedBaseSha;
    } else if (!mode) {
      const getResponse = await fetchImpl(url, { headers });

      if (getResponse.ok) {
        const fileData = await getResponse.json() as GitHubContentsResponse;
        sha = fileData.sha;
      } else if (getResponse.status !== 404) {
        return { success: false, error: `Failed to inspect file: ${getResponse.statusText || getResponse.status}` };
      }
    }

    const putBody: {
      message: string;
      content: string;
      sha?: string;
    } = {
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {}),
    };

    const putResponse = await fetchImpl(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putBody),
    });

    if (!putResponse.ok) {
      const errorData = await putResponse.json().catch(() => null) as GitHubUpdateResponse | null;
      const detail = errorData?.message ? ` (${errorData.message})` : '';
      return { success: false, error: `Failed to put file: ${putResponse.statusText || putResponse.status}${detail}` };
    }

    const result = await putResponse.json() as GitHubUpdateResponse;
    return { success: true, commitSha: result.commit?.sha };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
