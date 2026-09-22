import { getPineconeIndex } from '../config/pinecone.js';

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Embedding model load ho raha hai...');
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model ready ✅');
  }
  return embedder;
}

export async function embedAndStore(chunks, userId) {
  const index = getPineconeIndex();
  const embed = await getEmbedder();
  let stored = 0;

  const vectors = [];

  for (const chunk of chunks) {
    try {
      const output = await embed(chunk.content, {
        pooling: 'mean',
        normalize: true
      });

      const values = Array.from(output.data);

      vectors.push({
        id: String(chunk.id),
        values: values,
        metadata: {
          repo:     String(chunk.metadata.repo),
          filePath: String(chunk.metadata.filePath),
          language: String(chunk.metadata.language || ''),
          userId:   String(userId),
          content:  String(chunk.content).slice(0, 500)
        }
      });

      console.log(`Embedding ready: ${chunk.id}`);

    } catch (error) {
      console.error(`Embedding error ${chunk.id}:`, error.message);
    }
  }

  if (vectors.length > 0) {
    try {
      await index.upsert(vectors);
      stored = vectors.length;
      console.log(`✅ Stored ${stored} chunks`);
    } catch (error) {
      console.error('Upsert error:', error.message);
    }
  }

  return stored;
}

export async function deleteRepoEmbeddings(repoName, userId) {
  try {
    const index = getPineconeIndex();
    await index.deleteMany({
      repo: repoName,
      userId: String(userId)
    });
    console.log(`Deleted: ${repoName}`);
  } catch (error) {
    console.error('Delete error:', error.message);
  }
}