import AsyncStorage from '@react-native-async-storage/async-storage';

const VISITOR_ID_KEY = 'visitor_id';

function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Stable device id for guest analytics (same DB as jeweller dashboard). */
export async function getVisitorId(): Promise<string> {
  const existing = await AsyncStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const visitorId = generateUuidV4();
  await AsyncStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}
