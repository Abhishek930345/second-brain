export function chunkFiles(files, repoName) {
  const allChunks = [];
  const CHUNK_SIZE = 60;      // 60 lines per chunk
  const OVERLAP = 10;         // 10 lines overlap

  for (const file of files) {
    const lines = file.content.split('\n');

    // Chhoti files ek hi chunk mein
    if (lines.length <= CHUNK_SIZE) {
      const content = file.content.trim();
      if (content.length < 30) continue;

      allChunks.push({
        id: generateId(repoName, file.path, 0),
        content,
        metadata: {
          repo: repoName,
          filePath: file.path,
          language: file.language,
          startLine: 1,
          endLine: lines.length,
          type: 'full_file'
        }
      });
      continue;
    }

    // Badi files ko chunks mein todo
    for (let i = 0; i < lines.length; i += CHUNK_SIZE - OVERLAP) {
      const chunkLines = lines.slice(i, i + CHUNK_SIZE);
      const content = chunkLines.join('\n').trim();

      // Bahut chhote chunks skip karo
      if (content.length < 30) continue;

      allChunks.push({
        id: generateId(repoName, file.path, i),
        content,
        metadata: {
          repo: repoName,
          filePath: file.path,
          language: file.language,
          startLine: i + 1,
          endLine: i + CHUNK_SIZE,
          type: 'chunk'
        }
      });
    }
  }

  console.log(`Total chunks created: ${allChunks.length}`);
  return allChunks;
}

function generateId(repo, filePath, startLine) {
  // Safe ID banao special characters remove karke
  const safeRepo = repo.replace(/[^a-zA-Z0-9]/g, '_');
  const safePath = filePath.replace(/[^a-zA-Z0-9]/g, '_');
  return `${safeRepo}__${safePath}__${startLine}`;
}