"""
Thin wrapper around the GitHub REST API.

Constructed with a decrypted PAT. All methods raise GithubError on non-2xx
responses so callers can wrap a single try/except.

Docs: https://docs.github.com/en/rest
"""
import base64
from typing import Optional

import requests

GITHUB_API = 'https://api.github.com'
DEFAULT_TIMEOUT = 15  # seconds


class GithubError(Exception):
    """Raised when the GitHub API returns a non-2xx response."""

    def __init__(self, message: str, status: int = 0):
        super().__init__(message)
        self.status = status


class GithubClient:
    def __init__(self, token: str):
        if not token:
            raise GithubError('No token provided.', status=401)
        self._session = requests.Session()
        self._session.headers.update({
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        })

    # --- HTTP plumbing ----------------------------------------------------

    def _get(self, path: str, params: Optional[dict] = None) -> dict | list:
        url = f'{GITHUB_API}{path}'
        try:
            r = self._session.get(url, params=params, timeout=DEFAULT_TIMEOUT)
        except requests.RequestException as e:
            raise GithubError(f'Network error: {e}', status=0) from e

        if r.status_code == 401:
            raise GithubError('Invalid or expired GitHub token.', status=401)
        if r.status_code == 404:
            raise GithubError('Resource not found on GitHub.', status=404)
        if r.status_code == 403 and 'rate limit' in r.text.lower():
            raise GithubError('GitHub rate limit exceeded.', status=403)
        if not r.ok:
            raise GithubError(f'GitHub error {r.status_code}: {r.text[:200]}', status=r.status_code)
        return r.json()

    # --- Public methods ---------------------------------------------------

    def validate(self) -> dict:
        """Confirm the token works. Returns the authenticated user's profile."""
        return self._get('/user')

    def list_repos(self, per_page: int = 100) -> list[dict]:
        """List repos accessible to the authenticated user, most recently pushed first."""
        return self._get('/user/repos', params={
            'sort': 'pushed',
            'direction': 'desc',
            'per_page': per_page,
        })

    def list_files(self, repo_full_name: str, path: str = '', ref: Optional[str] = None) -> list[dict]:
        """List files/folders at a given path in the repo."""
        params = {'ref': ref} if ref else None
        result = self._get(f'/repos/{repo_full_name}/contents/{path}', params=params)
        # When path is a file, GitHub returns a dict instead of a list
        return result if isinstance(result, list) else [result]

    def read_file(self, repo_full_name: str, path: str, ref: Optional[str] = None) -> str:
        """Read a file's content as a string."""
        params = {'ref': ref} if ref else None
        result = self._get(f'/repos/{repo_full_name}/contents/{path}', params=params)
        if isinstance(result, list):
            raise GithubError(f'{path} is a directory, not a file.', status=400)
        if result.get('encoding') != 'base64':
            raise GithubError(f'Unsupported encoding: {result.get("encoding")}', status=500)
        return base64.b64decode(result['content']).decode('utf-8', errors='replace')

    def search_code(self, repo_full_name: str, query: str, per_page: int = 20) -> list[dict]:
        """Search code within one repo. Query syntax: GitHub code-search."""
        return self._get('/search/code', params={
            'q': f'{query} repo:{repo_full_name}',
            'per_page': per_page,
        }).get('items', [])

    def recent_commits(self, repo_full_name: str, per_page: int = 10) -> list[dict]:
        return self._get(f'/repos/{repo_full_name}/commits', params={'per_page': per_page})

    def open_prs(self, repo_full_name: str) -> list[dict]:
        return self._get(f'/repos/{repo_full_name}/pulls', params={'state': 'open'})
