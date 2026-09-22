import Groq from 'groq-sdk';
import { getPineconeIndex } from '../config/pinecone.js';

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

export async function queryCodebase(question, userId, repoName = null) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const index = getPineconeIndex();

    console.log('🔍 Query start:', question);

    // Question embed karo
    const embed = await getEmbedder();
    const output = await embed(question, {
      pooling: 'mean',
      normalize: true
    });
    const queryVector = Array.from(output.data);
    console.log('✅ Question embedded, length:', queryVector.length);

    // Filter banao
    const filter = {};
    filter.userId = { '$eq': String(userId) };
    if (repoName) {
      filter.repo = { '$eq': String(repoName) };
    }

    console.log('Filter:', JSON.stringify(filter));

    // Pinecone search
    const searchRes = await index.query({
      vector: queryVector,
      topK: 6,
      filter,
      includeMetadata: true
    });

    console.log('Matches found:', searchRes.matches?.length);

    if (!searchRes.matches || searchRes.matches.length === 0) {
      return {
        answer: 'Is repo mein koi code nahi mila. Pehle repo ingest karo.',
        sources: []
      };
    }

    const chunks = searchRes.matches.map(m => ({
      content:  m.metadata?.content  || '',
      filePath: m.metadata?.filePath || '',
      repo:     m.metadata?.repo     || '',
      language: m.metadata?.language || '',
    }));

    const context = chunks
      .map(c => `// Repo: ${c.repo} | File: ${c.filePath}\n${c.content}`)
      .join('\n\n---\n\n');

    console.log('Context length:', context.length);

    // Groq se answer lo
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Tu ek expert code analyzer hai.
Tera kaam hai user ke apne GitHub codebase ke baare mein sawaalon ke jawab dena.
SIRF provided code context use kar jawab dene ke liye.
Hamesha file path cite kar jab code reference karo.
Jawab clear aur technical ho.`
        },
        {
          role: 'user',
          content: `Meri codebase ka context:\n\n${context}\n\nMera sawaal: ${question}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    console.log('✅ Groq answer received');

    return {
      answer: completion.choices[0].message.content,
      sources: chunks.map(c => ({
        file:     c.filePath,
        repo:     c.repo,
        language: c.language
      }))
    };

  } catch (error) {
    console.error('❌ queryCodebase error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}