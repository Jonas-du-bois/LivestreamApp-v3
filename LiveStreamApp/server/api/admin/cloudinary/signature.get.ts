import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { useValidatedQuery } from 'h3-zod';

const querySchema = z.object({
  folder: z.string().optional(),
  public_id: z.string().optional()
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Cloudinary configuration is missing.' });
  }

  const query = await useValidatedQuery(event, querySchema);

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const paramsToSign: Record<string, any> = {
    timestamp
  };

  if (query.folder) paramsToSign.folder = query.folder;
  if (query.public_id) paramsToSign.public_id = query.public_id;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    config.cloudinaryApiSecret
  );

  return {
    timestamp,
    signature,
    cloudName: config.cloudinaryCloudName,
    apiKey: config.cloudinaryApiKey,
    ...paramsToSign // Return the params so frontend includes them in FormData
  };
});
