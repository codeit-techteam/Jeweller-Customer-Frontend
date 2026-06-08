import Voice from "@react-native-voice/voice";

let cachedAvailability: boolean | null = null;

function isNativeVoiceLinked(): boolean {
  try {
    return Voice != null && typeof Voice.start === "function";
  } catch {
    return false;
  }
}

export async function isVoiceRecognitionAvailable(): Promise<boolean> {
  if (!isNativeVoiceLinked()) {
    cachedAvailability = false;
    return false;
  }
  if (cachedAvailability !== null) return cachedAvailability;
  try {
    const available = await Voice.isAvailable();
    cachedAvailability = Boolean(available);
  } catch {
    cachedAvailability = false;
  }
  return cachedAvailability;
}

export function removeVoiceListeners(): void {
  try {
    Voice.removeAllListeners();
  } catch {
    /* native module not linked (Expo Go) */
  }
}

export async function safeVoiceDestroy(): Promise<void> {
  if (!isNativeVoiceLinked()) {
    removeVoiceListeners();
    return;
  }
  try {
    const available = await isVoiceRecognitionAvailable();
    if (available) {
      await Voice.destroy();
    }
  } catch {
    /* ignore teardown errors */
  } finally {
    removeVoiceListeners();
  }
}

export async function safeVoiceCancel(): Promise<void> {
  if (!isNativeVoiceLinked()) return;
  try {
    await Voice.cancel();
  } catch {
    /* ignore */
  }
}

export async function safeVoiceStart(locale: string): Promise<boolean> {
  if (!isNativeVoiceLinked()) return false;
  try {
    const available = await isVoiceRecognitionAvailable();
    if (!available) return false;
    await Voice.start(locale);
    return true;
  } catch {
    return false;
  }
}

export async function safeVoiceStop(): Promise<void> {
  if (!isNativeVoiceLinked()) return;
  try {
    await Voice.stop();
  } catch {
    /* ignore */
  }
}
