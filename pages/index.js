import Head from 'next/head';
import { useState } from 'react';

import Footer from '@components/Footer';
import CSVSelect from '@components/CSVSelect';
import DataTables from '@components/DataTables';
import SummaryDashboard from '@components/SummaryDashboard';
import Card from '@components/Cards';

const LOC_MAP = {
  umebayashi: '梅林',
  rokujyo: '六条',
  ogakishi: '大垣',
  kanezawa: '金沢',
  nigata: '新潟',
  toyama: '富山',
  kusatsu: '草津',
  hikone: '彦根',
  moriokanishi: '盛岡西(滝沢)',
  morioka: '盛岡',
  tsushinmachi: '津新町',
  toyamaokuda: '富山奥田',
  fukushima: '福島',
};

export default function Home() {
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [reportDate, setReportDate] = useState(new Date(2025, 8, 1));

  const handleFileSelect = async (fileId, fileName) => {
    if (!fileId) return;

    setSelectedFileId(fileId);
    setIsLoading(true);
    setErrorMessage('');
    setApiData(null);

    const apiUrl = `https://kindlife-marke.app.n8n.cloud/webhook/getFTE?fileId=${fileId}`;
    // const apiUrl = `https://kindlife-marke.app.n8n.cloud/webhook-test/getFTE?fileId=${fileId}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const json = await response.json();
      setApiData(json);
      setLocation('summary');
    } catch (error) {
      setErrorMessage(error.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto max-w-screen px-8'>
      <Head>
        <title>常勤換算数</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <h1 className='text-3xl font-bold mt-8 mb-4 text-center'>常勤換算数</h1>
      <div className='flex gap-4'>
        <CSVSelect
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFileId}
        />
        <main className='flex-1 mt-8'>
          {!!apiData && (
            <div className='mb-4 flex gap-4'>
              <Card
                label='基準労働時間'
                value={apiData.basic_hours}
                className='w-96'
              />
              <Card
                label='対象月度'
                value={apiData.target_month}
                subValue={`${apiData.period_start} - ${apiData.period_end}`}
                className='w-96'
              />
            </div>
          )}
          {!!apiData && (
            <section className='flex gap-4 mb-8'>
              <nav className='menu'>
                <ul className='flex flex-wrap gap-2'>
                  <li>
                    <button
                      type='button'
                      onClick={() => setLocation('summary')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        location === 'summary'
                          ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      一覧
                    </button>
                  </li>
                  {Object.entries(LOC_MAP).map(([key, label]) => (
                    <li key={key}>
                      <button
                        type='button'
                        onClick={() => setLocation(key)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          location === key
                            ? 'bg-blue-500 text-white border-blue-500 font-semibold'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          )}

          {isLoading && <p className='text-gray-600'>読み込み中...</p>}
          {!isLoading && errorMessage && (
            <p className='text-red-600'>エラー: {errorMessage}</p>
          )}
          {!isLoading && !errorMessage && apiData && (
            <>
              {location === 'summary' ? (
                <SummaryDashboard data={apiData} locationMap={LOC_MAP} />
              ) : location && LOC_MAP[location] ? (
                <DataTables
                  data={apiData}
                  location={location}
                  reportDate={reportDate}
                />
              ) : null}
            </>
          )}
          {!location && apiData && (
            <p className='text-gray-500'>施設を選択してください。</p>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
