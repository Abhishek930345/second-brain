import { Octokit } from 'octokit';
import User from '../models/User.js';
import Groq from 'groq-sdk';

const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java',
  '.cpp', '.c', '.go', '.rb', '.php', '.cs',
  '.md', '.json', '.html', '.css', '.scss', '.vue'
];

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function getOctokit(userId) {
  const user = await User.findById(userId);
  return new Octokit({ auth: user.accessToken });
}

// Tree builder
function buildTree(items) {
  const root = {};

  for (const item of items) {
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {
          name:     part,
          path:     parts.slice(0, i + 1).join('/'),
          type:     i === parts.length - 1 ? item.type : 'tree',
          size:     item.size || 0,
          children: {}
        };
      }
      current = current[part].children;
    }
  }

  function toArray(obj) {
    return Object.values(obj)
      .map(item => ({
        ...item,
        children: item.type === 'tree' ? toArray(item.children) : []
      }))
      .sort((a, b) => {
        // Folders pehle, files baad mein
        if (a.type === 'tree' && b.type !== 'tree') return -1;
        if (a.type !== 'tree' && b.type === 'tree') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return toArray(root);
}

// ─── 1. REPO TREE ─────────────────────────────
export const getRepoTree = async (req, res) => {
  try {
    const { repoFullName } = req.query;
    const octokit = await getOctokit(req.user._id);
    const [owner, repo] = repoFullName.split('/');

    const { data } = await octokit.rest.git.getTree({
      owner, repo,
      tree_sha: 'HEAD',
      recursive: 'true'
    });

    // Sirf code files lo
    const filtered = data.tree.filter(item => {
      if (item.type === 'tree') return true;
      const ext = '.' + item.path.split('.').pop().toLowerCase();
      return CODE_EXTENSIONS.includes(ext);
    });

    const tree = buildTree(filtered);
    res.json({ tree, repoFullName });

  } catch (error) {
    console.error('getRepoTree:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 2. FILE CONTENT ──────────────────────────
export const getFileContent = async (req, res) => {
  try {
    const { repoFullName, filePath } = req.body;
    const octokit = await getOctokit(req.user._id);
    const [owner, repo] = repoFullName.split('/');

    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: filePath
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const lines   = content.split('\n');

    // TODO/FIXME count
    const todos = lines.filter(l =>
      /TODO|FIXME|HACK|XXX/i.test(l)
    ).length;

    // Complexity estimate
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(/g) || []).length;
    const complexity = functions > 15 ? 'High' : functions > 8 ? 'Medium' : 'Low';

    res.json({
      content,
      filePath,
      language:   filePath.split('.').pop(),
      lines:      lines.length,
      size:       data.size,
      todoCount:  todos,
      functions,
      complexity,
      sha:        data.sha
    });

  } catch (error) {
    console.error('getFileContent:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 3. FILE HISTORY ──────────────────────────
export const getFileHistory = async (req, res) => {
  try {
    const { repoFullName, filePath } = req.body;
    const octokit = await getOctokit(req.user._id);
    const [owner, repo] = repoFullName.split('/');

    const { data } = await octokit.rest.repos.listCommits({
      owner, repo,
      path:     filePath,
      per_page: 8
    });

    const commits = data.map(c => ({
      sha:     c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      author:  c.commit.author.name,
      date:    c.commit.author.date,
      url:     c.html_url
    }));

    res.json({ commits });

  } catch (error) {
    console.error('getFileHistory:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 4. AI EXPLAIN ────────────────────────────
export const explainFile = async (req, res) => {
  try {
    const { content, filePath } = req.body;
    const groq = getGroq();

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek expert code explainer hai.
Code ko simple aur clear language mein explain kar.
Format:
## Kya Karta Hai
[1-2 lines]

## Kaise Kaam Karta Hai
[Step by step]

## Important Parts
[Key functions/variables]

## Kahan Use Hota Hai
[Project mein role]`
        },
        {
          role: 'user',
          content: `File: ${filePath}\n\n${content.slice(0, 3000)}`
        }
      ],
      temperature: 0.3,
      max_tokens:  1500
    });

    res.json({ explanation: completion.choices[0].message.content });

  } catch (error) {
    console.error('explainFile:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 5. FILE BUGS ─────────────────────────────
export const findFileBugs = async (req, res) => {
  try {
    const { content, filePath } = req.body;
    const groq = getGroq();

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek expert code reviewer hai.
JSON format mein do:
{
  "bugs": [
    {
      "severity": "high/medium/low",
      "line": "line number",
      "issue": "kya problem hai",
      "fix": "kaise fix karein"
    }
  ],
  "summary": "overall assessment"
}
Sirf JSON do.`
        },
        {
          role: 'user',
          content: `File: ${filePath}\n\n${content.slice(0, 3000)}`
        }
      ],
      temperature: 0.2,
      max_tokens:  1500
    });

    let result;
    try {
      const text  = completion.choices[0].message.content;
      const match = text.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { bugs: [], summary: text };
    } catch {
      result = { bugs: [], summary: completion.choices[0].message.content };
    }

    res.json(result);

  } catch (error) {
    console.error('findFileBugs:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 6. FUNCTION SEARCH ───────────────────────
export const searchFunction = async (req, res) => {
  try {
    const { content, filePath, query } = req.body;

    const lines   = content.split('\n');
    const results = [];

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          lineNumber: index + 1,
          line:       line.trim(),
          context:    lines.slice(
            Math.max(0, index - 2),
            Math.min(lines.length, index + 3)
          ).join('\n')
        });
      }
    });

    res.json({ results, query, filePath });

  } catch (error) {
    console.error('searchFunction:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 7. TODO FINDER ───────────────────────────
export const findTodos = async (req, res) => {
  try {
    const { content, filePath } = req.body;
    const lines = content.split('\n');
    const todos = [];

    lines.forEach((line, index) => {
      const match = line.match(/(TODO|FIXME|HACK|XXX|NOTE|BUG)[:!\s]*(.*)/i);
      if (match) {
        todos.push({
          type:       match[1].toUpperCase(),
          message:    match[2].trim(),
          lineNumber: index + 1,
          line:       line.trim()
        });
      }
    });

    res.json({ todos, filePath });

  } catch (error) {
    console.error('findTodos:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 8. AI SUMMARY ────────────────────────────
export const getAiSummary = async (req, res) => {
  try {
    const { content, filePath } = req.body;
    const groq = getGroq();

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Ek line mein is file ka purpose batao.
Max 20 words. Simple language. No technical jargon.`
        },
        {
          role: 'user',
          content: `File: ${filePath}\n\n${content.slice(0, 1000)}`
        }
      ],
      temperature: 0.3,
      max_tokens:  100
    });

    res.json({ summary: completion.choices[0].message.content });

  } catch (error) {
    console.error('getAiSummary:', error.message);
    res.status(500).json({ message: error.message });
  }
};