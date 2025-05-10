import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from '../components/Layout';
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/background.css';

// Create a client for React Query
const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-wrapper relative">
        <div className="animated-background"></div>
        <div className="background-dots"></div>
        <div className="glow-effect"></div>
        <div className="glow-effect-2"></div>
        <Head>
          <title>NatureID | Plant & Animal Identification with AI</title>
          <meta name="description" content="Instantly identify plants and animals with our AI technology. Upload photos for accurate species identification." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </div>
    </QueryClientProvider>
  );
}

export default MyApp;
