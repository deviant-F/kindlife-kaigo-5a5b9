import { useState, useEffect } from 'react';

const CSVSelect = ({ onFileSelect, selectedFileId }) => {
  const [csvList, setCsvList] = useState(null);
  const [isCsvLoading, setIsCsvLoading] = useState(false);
  const [csvErrorMessage, setCsvErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const apiUrlCSV = 'https://kindlife-marke.app.n8n.cloud/webhook/getcsv';

  const handleFetchCsvList = async () => {
    setIsCsvLoading(true);
    setCsvErrorMessage('');
    try {
      const response = await fetch(apiUrlCSV);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setCsvList(data);
    } catch (error) {
      setCsvErrorMessage(error.message || 'Unexpected error');
    } finally {
      setIsCsvLoading(false);
    }
  };

  // Automatically fetch CSV list when component mounts
  useEffect(() => {
    handleFetchCsvList();
  }, []);

  const handleChange = (fileId) => {
    if (onFileSelect) {
      onFileSelect(fileId);
    }
  };

  return (
    <div className={`transition-all duration-300`}>
      <label
        className={`text-md font-medium text-gray-700 ${
          isExpanded ? '' : 'flex flex-col items-center leading-tight'
        }`}
      >
        {isExpanded ? (
          'ファイル'
        ) : (
          <>
            {'ファイル'.split('').map((char, index) => (
              <span key={index}>{char}</span>
            ))}
          </>
        )}
      </label>

      {!isExpanded ? null : isCsvLoading ? (
        <p className='text-gray-600 text-sm'>読み込み中...</p>
      ) : csvErrorMessage ? (
        <p className='text-red-600 text-sm'>Error: {csvErrorMessage}</p>
      ) : csvList && csvList.length > 0 ? (
        <ul className='w-full overflow-auto max-h-82'>
          {[...csvList]
            .sort((a, b) => b.name.localeCompare(a.name))
            .map((file) => (
              <li key={file.id} className='my-1 bg-white rounded-lg'>
                <button
                  type='button'
                  onClick={() => handleChange(file.id)}
                  className={`w-full px-4 py-2 text-left text-ellipsis overflow-hidden hover:bg-gray-100 transition-colors ${
                    selectedFileId === file.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : ''
                  }`}
                >
                  {file.name}
                  {file.modifiedTime &&
                    ` (${new Date(file.modifiedTime).toLocaleDateString(
                      'ja-JP'
                    )})`}
                </button>
              </li>
            ))}
        </ul>
      ) : isExpanded ? (
        <p className='text-gray-500 text-sm'>CSVファイルがありません。</p>
      ) : null}
      {csvList && csvList.length > 0 && (
        <button
          type='button'
          onClick={() =>
            csvList && csvList.length > 0 && setIsExpanded(!isExpanded)
          }
          className={`flex items-center w-full my-4 bg-white rounded-lg p-2 hover:opacity-80 transition-opacity ${
            isExpanded ? '' : 'flex-col'
          }`}
          disabled={!csvList || csvList.length === 0}
        >
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isExpanded ? 'rotate-90' : 'rotate-270'
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-label='Collapse list'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
          {isExpanded ? 'Collapse' : ''}
        </button>
      )}
    </div>
  );
};

export default CSVSelect;
