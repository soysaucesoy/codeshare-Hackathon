import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../components/layout/AuthProvider';

// Layoutコンポーネントのインポートを削除

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* Layoutコンポーネントによるラップを削除 */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;