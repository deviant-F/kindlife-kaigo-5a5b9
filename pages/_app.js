import '@styles/globals.css';
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

function Application({ Component, pageProps }) {
  return (
    <div className={notoSansJP.className}>
      <Component {...pageProps} />
    </div>
  );
}

export default Application;
