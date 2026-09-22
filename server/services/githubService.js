import { Octokit } from 'octokit';

// Ye extensions ki files hi lenge
const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.cpp', '.c',
  '.go', '.rb', '.php', '.cs',
  '.md', '.json', '.env.example',
  '.html', '.css', '.scss'
];

export async function fetchUserRepos(accessToken) {
  try {
    const octokit = new Octokit({ auth: accessToken });

    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      type: 'all'
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      language: repo.language || '',
      stars: repo.stargazers_count,
      isPrivate: repo.private,
      updatedAt: repo.updated_at,
      url: repo.html_url
    }));

  } catch (error) {
    throw new Error(`GitHub repos fetch error: ${error.message}`);
  }
}

export async function fetchRepoFiles(accessToken, repoFullName) {
  try {
    const octokit = new Octokit({ auth: accessToken });
    const [owner, repo] = repoFullName.split('/');

    // Poora file tree lo
    const { data: tree } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true'
    });

    const files = [];

    for (const item of tree.tree) {
      // Sirf files lo folders nahi
      if (item.type !== 'blob') continue;

      // Extension check karo
      const ext = '.' + item.path.split('.').pop().toLowerCase();
      if (!CODE_EXTENSIONS.includes(ext)) continue;

      // Bahut badi files skip karo
      if (item.size > 150000) continue;

      try {
        // File ka content lo
        const { data: blob } = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: item.sha
        });

        const content = Buffer.from(blob.content, 'base64').toString('utf-8');

        // Empty files skip karo
        if (!content.trim()) continue;

        files.push({
          path: item.path,
          content,
          language: ext.replace('.', ''),
          size: item.size
        });

      } catch (err) {
        // Ek file fail ho toh skip karo baaki continue karo
        console.log(`File skip: ${item.path}`);
        continue;
      }
    }

    console.log(`Total files fetched: ${files.length}`);
    return files;

  } catch (error) {
    throw new Error(`GitHub files fetch error: ${error.message}`);
  }
}