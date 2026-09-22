import Repo from '../models/Repo.js';
import User from '../models/User.js';
import { fetchUserRepos, fetchRepoFiles } from '../services/githubService.js';
import { chunkFiles } from '../services/chunkerService.js';
import { embedAndStore, deleteRepoEmbeddings } from '../services/embeddingService.js';

// User ke GitHub repos list karo
export const getUserRepos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    console.log('Getting repos for user:', user?.username);

    const githubRepos = await fetchUserRepos(user.accessToken);
    const ingestedRepos = await Repo.find({ userId: req.user._id });

    const mergedRepos = githubRepos.map(ghRepo => {
      const ingested = ingestedRepos.find(
        r => r.repoFullName === ghRepo.fullName
      );
      return {
        ...ghRepo,
        isIngested: !!ingested,
        ingestedData: ingested || null
      };
    });

    res.json(mergedRepos);

  } catch (error) {
    console.error('getUserRepos error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Repo ingest karo
export const ingestRepo = async (req, res) => {
  try {
    const { repoFullName, repoName, description, language, stars } = req.body;
    const userId = req.user._id;

    console.log('Ingest request:', repoFullName);

    let repo = await Repo.findOne({ userId, repoFullName });

    if (repo && repo.status === 'ingesting') {
      return res.status(400).json({
        message: 'Ye repo already ingest ho raha hai — wait karo'
      });
    }

    if (!repo) {
      repo = await Repo.create({
        userId,
        repoName,
        repoFullName,
        description,
        language,
        stars,
        status: 'ingesting'
      });
    } else {
      repo.status = 'ingesting';
      await repo.save();
    }

    res.json({
      message: 'Ingestion shuru ho gayi!',
      repoId: repo._id
    });

    // Background ingestion
    (async () => {
      try {
        console.log(`\n🚀 Ingestion shuru: ${repoFullName}`);

        const user = await User.findById(userId);
        console.log('User found:', user?.username);
        console.log('Access token:', user?.accessToken ? '✅ exists' : '❌ MISSING');

        if (!user || !user.accessToken) {
          throw new Error('User ya access token nahi mila — dobara login karo');
        }

        // Step 1 — Files fetch
        console.log('Step 1: Files fetch kar raha hai...');
        const files = await fetchRepoFiles(user.accessToken, repoFullName);
        console.log(`Files fetched: ${files.length}`);

        if (files.length === 0) {
          throw new Error('Koi files nahi mili — repo empty hai ya private');
        }

        // Step 2 — Chunks
        console.log('Step 2: Chunks bana raha hai...');
        const chunks = chunkFiles(files, repoName);
        console.log(`Chunks ready: ${chunks.length}`);

        if (chunks.length === 0) {
          throw new Error('Chunks nahi bane — files mein code nahi hai');
        }

        // Step 3 — Embed
        console.log('Step 3: Embedding aur store kar raha hai...');
        const stored = await embedAndStore(chunks, userId);
        console.log(`Stored: ${stored} chunks`);

        // Step 4 — Scores
        console.log('Step 4: Scores calculate kar raha hai...');
        const scores = calculateScores(files);
        console.log('Scores:', scores);

        // Step 5 — Update
        await Repo.findByIdAndUpdate(repo._id, {
          status:        'ready',
          totalChunks:   stored,
          lastIngested:  new Date(),
          securityScore: scores.security,
          qualityScore:  scores.quality,
          docScore:      scores.docs
        });

        console.log(`\n✅ Ingestion complete: ${repoFullName}`);

      } catch (err) {
        console.error(`\n❌ Ingestion failed: ${err.message}`);
        console.error(`Stack: ${err.stack}`);

        await Repo.findByIdAndUpdate(repo._id, {
          status: 'error'
        });
      }
    })();

  } catch (error) {
    console.error('ingestRepo error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Ingested repos list karo
export const getIngestedRepos = async (req, res) => {
  try {
    const repos = await Repo.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(repos);
  } catch (error) {
    console.error('getIngestedRepos error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Repo status check karo
export const getRepoStatus = async (req, res) => {
  try {
    const repo = await Repo.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!repo) {
      return res.status(404).json({ message: 'Repo nahi mila' });
    }

    res.json({
      status:       repo.status,
      totalChunks:  repo.totalChunks,
      lastIngested: repo.lastIngested
    });

  } catch (error) {
    console.error('getRepoStatus error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Repo delete karo
export const deleteRepo = async (req, res) => {
  try {
    const repo = await Repo.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!repo) {
      return res.status(404).json({ message: 'Repo nahi mila' });
    }

    await deleteRepoEmbeddings(repo.repoName, req.user._id);
    await Repo.findByIdAndDelete(req.params.id);

    res.json({ message: 'Repo delete ho gaya' });

  } catch (error) {
    console.error('deleteRepo error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Re-index karo
export const reindexRepo = async (req, res) => {
  try {
    const repo = await Repo.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!repo) {
      return res.status(404).json({ message: 'Repo nahi mila' });
    }

    await deleteRepoEmbeddings(repo.repoName, req.user._id);

    req.body = {
      repoFullName: repo.repoFullName,
      repoName:     repo.repoName
    };

    await ingestRepo(req, res);

  } catch (error) {
    console.error('reindexRepo error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Helper — Scores calculate karo
function calculateScores(files) {
  let securityIssues      = 0;
  let totalFunctions      = 0;
  let documentedFunctions = 0;
  let longFunctions       = 0;

  for (const file of files) {
    const content = file.content;
    const lines   = content.split('\n');

    // Security check
    if (/password\s*=\s*['"][^'"]+['"]/i.test(content)) securityIssues++;
    if (/api_key\s*=\s*['"][^'"]+['"]/i.test(content))  securityIssues++;
    if (/secret\s*=\s*['"][^'"]+['"]/i.test(content))   securityIssues++;

    // Documentation check
    const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
    totalFunctions += functions.length;
    const comments = content.match(/\/\*\*[\s\S]*?\*\/|\/\/.+/g) || [];
    documentedFunctions += comments.length;

    // Quality check
    for (let i = 0; i < lines.length - 50; i += 50) {
      longFunctions++;
    }
  }

  const securityScore = Math.max(0, 100 - (securityIssues * 20));
  const docScore      = totalFunctions > 0
    ? Math.min(100, Math.round((documentedFunctions / totalFunctions) * 100))
    : 50;
  const qualityScore  = Math.max(0, 100 - (longFunctions * 5));

  return {
    security: securityScore,
    docs:     docScore,
    quality:  qualityScore
  };
}