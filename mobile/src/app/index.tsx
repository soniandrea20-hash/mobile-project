import { Redirect } from 'expo-router';

import { DEFAULT_STORE_SLUG } from '@/lib/tenant';

export default function Index() {
  return <Redirect href={`/${DEFAULT_STORE_SLUG}`} />;
}
