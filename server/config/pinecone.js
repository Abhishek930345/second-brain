import { Pinecone } from '@pinecone-database/pinecone';

let pineconeIndex = null;

export const connectPinecone = async () => {
  try {
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    pineconeIndex = pc.index(process.env.PINECONE_INDEX);
    console.log('Pinecone Connected ✅');
  } catch (error) {
    console.error(`Pinecone Error: ${error.message} ❌`);
  }
};

export const getPineconeIndex = () => pineconeIndex;