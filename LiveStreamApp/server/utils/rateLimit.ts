export const isRateLimited = async (key: string, maxRequests = 5, windowMs = 60000): Promise<boolean> => {
  const storage = useStorage('cache:rate-limit');
  const now = Date.now();
  
  const record: any = await storage.getItem(key);
  if (!record || now - record.start > windowMs) {
    await storage.setItem(key, { count: 1, start: now });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  await storage.setItem(key, record);
  return false;
};