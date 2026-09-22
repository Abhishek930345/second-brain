import Groq from 'groq-sdk';
import { getPineconeIndex } from '../config/pinecone.js';
import Repo from '../models/Repo.js';

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embedder;
}

async function searchVectors(queryText, userId, repoName, topK = 8) {
  const index = getPineconeIndex();
  const embed = await getEmbedder();

  const output = await embed(queryText, {
    pooling: 'mean',
    normalize: true
  });
  const queryVector = Array.from(output.data);

  const filter = { userId: { '$eq': String(userId) } };
  if (repoName) filter.repo = { '$eq': String(repoName) };

  const searchRes = await index.query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata: true
  });

  return searchRes.matches || [];
}

// ─── 1. CODE EXPLAIN BOT ───────────────────────────────────
export const explainCode = async (req, res) => {
  try {
    const { repoName, fileName } = req.body;
    const userId = req.user._id;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    console.log('Explaining:', fileName, 'in', repoName);

    // File ka code dhundho
    const matches = await searchVectors(fileName, userId, repoName, 5);

    if (!matches.length) {
      return res.status(404).json({ message: 'File nahi mili' });
    }

    const code = matches
      .map(m => `// File: ${m.metadata.filePath}\n${m.metadata.content}`)
      .join('\n\n---\n\n');

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek expert code explainer hai.
Code ko simple aur clear language mein explain kar.
Ye batao:
1. Is file/function ka kya kaam hai
2. Kaise kaam karta hai step by step
3. Important variables/functions kya hain
4. Koi complex logic hai toh explain karo
Hindi aur English mix mein jawab do.`
        },
        {
          role: 'user',
          content: `Is code ko explain karo:\n\n${code}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    res.json({
      explanation: completion.choices[0].message.content,
      fileName,
      repoName
    });

  } catch (error) {
    console.error('explainCode error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 2. BUG FINDER ────────────────────────────────────────
export const findBugs = async (req, res) => {
  try {
    const { repoName } = req.body;
    const userId = req.user._id;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    console.log('Finding bugs in:', repoName);

    // Poori repo ka code lo
    const matches = await searchVectors(
      'function error null undefined bug',
      userId,
      repoName,
      10
    );

    if (!matches.length) {
      return res.status(404).json({ message: 'Repo ka code nahi mila' });
    }

    const code = matches
      .map(m => `// File: ${m.metadata.filePath}\n${m.metadata.content}`)
      .join('\n\n---\n\n');

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek expert code reviewer aur bug hunter hai.
Code analyze kar aur bugs dhundh.
JSON format mein jawab do:
{
  "bugs": [
    {
      "severity": "high/medium/low",
      "file": "filename",
      "line": "line number ya range",
      "issue": "kya problem hai",
      "fix": "kaise fix karein"
    }
  ],
  "summary": "overall code health"
}
Sirf JSON do — koi extra text nahi.`
        },
        {
          role: 'user',
          content: `Is code mein bugs dhundho:\n\n${code}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    let result;
    try {
      const text = completion.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { bugs: [], summary: text };
    } catch {
      result = {
        bugs: [],
        summary: completion.choices[0].message.content
      };
    }

    res.json(result);

  } catch (error) {
    console.error('findBugs error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 3. CODE SEARCH ENGINE ────────────────────────────────
export const searchCode = async (req, res) => {
  try {
    const { query, repoName } = req.body;
    const userId = req.user._id;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    console.log('Searching:', query);

    const matches = await searchVectors(query, userId, repoName, 8);

    if (!matches.length) {
      return res.json({ results: [], message: 'Koi code nahi mila' });
    }

    // AI se relevant results filter karwao
    const context = matches
      .map(m => `File: ${m.metadata.filePath}\nScore: ${m.score}\n${m.metadata.content}`)
      .join('\n\n---\n\n');

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek code search engine hai.
User ne "${query}" search kiya hai.
JSON format mein relevant results do:
{
  "results": [
    {
      "file": "filepath",
      "relevance": "high/medium/low",
      "snippet": "relevant code snippet (max 3 lines)",
      "description": "is file mein query se related kya hai"
    }
  ]
}
Sirf JSON do.`
        },
        {
          role: 'user',
          content: `Query: "${query}"\n\nCode:\n${context}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    let result;
    try {
      const text = completion.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [] };
    } catch {
      result = { results: matches.map(m => ({
        file: m.metadata.filePath,
        relevance: 'medium',
        snippet: m.metadata.content?.slice(0, 100),
        description: 'Match found'
      }))};
    }

    res.json(result);

  } catch (error) {
    console.error('searchCode error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── 4. API DOC GENERATOR ─────────────────────────────────
export const generateApiDocs = async (req, res) => {
  try {
    const { repoName } = req.body;
    const userId = req.user._id;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    console.log('Generating API docs for:', repoName);

    // Routes aur controllers dhundho
    const matches = await searchVectors(
      'router route api endpoint get post put delete',
      userId,
      repoName,
      10
    );

    if (!matches.length) {
      return res.status(404).json({ message: 'API routes nahi mile' });
    }

    const code = matches
      .map(m => `// File: ${m.metadata.filePath}\n${m.metadata.content}`)
      .join('\n\n---\n\n');

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek API documentation expert hai.
Code se API endpoints dhundh aur documentation banao.
JSON format mein do:
{
  "title": "API Documentation",
  "baseUrl": "/api",
  "endpoints": [
    {
      "method": "GET/POST/PUT/DELETE",
      "path": "/endpoint/path",
      "description": "kya karta hai",
      "requestBody": { "field": "type - description" },
      "response": { "field": "type - description" },
      "auth": true/false
    }
  ]
}
Sirf JSON do.`
        },
        {
          role: 'user',
          content: `Is code se API documentation banao:\n\n${code}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2500
    });

    let result;
    try {
      const text = completion.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { endpoints: [] };
    } catch {
      result = { endpoints: [], raw: completion.choices[0].message.content };
    }

    res.json(result);

  } catch (error) {
    console.error('generateApiDocs error:', error.message);
    res.status(500).json({ message: error.message });
  }
};