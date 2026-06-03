import { Redirect } from 'expo-router';

/** Legacy route — full selector lives at `/(app)/location-selector`. */
export default function ManualLocationScreen() {
  return <Redirect href="/(app)/location-selector" />;
}

