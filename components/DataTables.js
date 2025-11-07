import { parse, isSameMonth, isFuture } from 'date-fns';
import Card from './Cards';

const TableHeader = ({ children, align = 'left' }) => {
  const alignClass =
    {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align] || 'text-left';

  return (
    <th
      className={`border border-gray-200 px-2 py-1 ${alignClass} text-gray-700 font-medium`}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children, align = 'left' }) => {
  const alignClass =
    {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align] || 'text-left';

  return (
    <td className={`border border-gray-200 px-2 py-1 ${alignClass}`}>
      {children}
    </td>
  );
};

const DataTables = ({ data, location, reportDate }) => {
  return (
    <div className='grid grid-cols-3 gap-8'>
      <Table
        data={data}
        type='kango'
        location={location}
        reportDate={reportDate}
      />
      <Table
        data={data}
        type='kaigo'
        location={location}
        reportDate={reportDate}
      />
      <Table
        data={data}
        type='yuryo'
        location={location}
        reportDate={reportDate}
      />
    </div>
  );
};

const Table = ({ data, type, location, reportDate }) => {
  const rows =
    data && data['details'][location] && data['details'][location][type]
      ? data['details'][location][type].staffs
      : [];
  const titleMap = { kaigo: '介護', kango: '看護', yuryo: '有料' };
  const totalRatio = rows.reduce((acc, { equivalent_ratio: r }) => acc + r, 0);
  const workingHours = rows.reduce((acc, { working_hours: w }) => acc + w, 0);
  const fullTime = rows.filter(
    ({ employment_type }) => employment_type === '正社員'
  ).length;
  const partTime = rows.filter(
    ({ employment_type }) => employment_type === 'パート'
  ).length;

  return (
    <div className=''>
      <h4 className={`text-lg font-bold mb-4 text-center bg-(--color-${type})`}>
        {titleMap[type]}
      </h4>
      {!rows?.length ? (
        <div className='flex-auto min-w-0.3'>データがありません。</div>
      ) : (
        <>
          <div className='flex gap-4 mb-4'>
            <Card label='社員' value={rows.length} className={['flex-auto']} />
            <Card label='正社員' value={fullTime} className={['flex-auto']} />
            <Card label='パート' value={partTime} className={['flex-auto']} />
            <Card
              label='労働時間'
              value={workingHours.toFixed(2)}
              className={['flex-auto']}
            />
            <Card
              label='常勤換算'
              value={totalRatio.toFixed(2)}
              className={['flex-auto']}
            />
          </div>
          <table className='table-fixed w-full bg-white border border-gray-200'>
            <thead>
              <tr className='bg-gray-100'>
                <TableHeader align='left'>氏名</TableHeader>
                <TableHeader align='center'>雇用形態</TableHeader>
                <TableHeader align='right'>労働時間</TableHeader>
                <TableHeader align='center'>常勤換算</TableHeader>
                <TableHeader align='left'>備考</TableHeader>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className='bg-white'>
                  <TableCell align='left'>{String(row.name ?? '')}</TableCell>
                  <TableCell align='center'>
                    {String(row.employment_type ?? '')}
                  </TableCell>
                  <TableCell align='right'>
                    {String(row.working_hours?.toFixed(2) ?? '')}
                  </TableCell>
                  <TableCell align='center'>
                    {row.equivalent_ratio?.toFixed(2) ?? ''}
                  </TableCell>
                  <TableCell align='left'>
                    {(row.start_date &&
                      isSameMonth(
                        parse(row.start_date, 'MM/dd/yyyy', new Date()),
                        reportDate
                      )) ||
                    isFuture(parse(row.start_date, 'MM/dd/yyyy', new Date()))
                      ? `【入社】${row.start_date}`
                      : ''}
                    {row.termination_date
                      ? `【退職】${row.termination_date}`
                      : ''}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DataTables;
