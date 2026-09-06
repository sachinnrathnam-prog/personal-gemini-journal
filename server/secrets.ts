import dotenv from 'dotenv';
dotenv.config();

let cachedApiKey: string | null = null;

/**
 * Retrieves the Gemini API key securely through the server runtime or Secret Manager.
 * Never exposes the key to the client or commits it to repository.
 */
export async function getGeminiApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  // 1. Check if configured with a specific Google Cloud Secret Manager resource path
  const secretName = process.env.GEMINI_SECRET_NAME;
  if (secretName) {
    try {
      const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
      const client = new SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({ name: secretName });
      const payload = version.payload?.data?.toString();
      if (payload) {
        cachedApiKey = payload.trim();
        return cachedApiKey;
      }
    } catch (err) {
      console.warn('Secret Manager direct access attempt failed, checking runtime environment...');
    }
  }

  // 2. Server runtime injected secret (e.g. Cloud Run mounted secret / AI Studio injected environment variable)
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey !== 'MY_GEMINI_API_KEY') {
    cachedApiKey = envKey.trim();
    return cachedApiKey;
  }

  throw new Error('Gemini API key is not configured in the server environment.');
}
