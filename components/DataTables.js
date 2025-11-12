import { parse, format, isSameDay, isFuture, isAfter } from 'date-fns';
import Card from './Cards';

const TableHeader = ({ children, align = 'left', width }) => {
  const alignClass =
    {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align] || 'text-left';

  return (
    <th
      className={`border border-gray-200 px-2 py-1 ${alignClass} text-gray-700 font-medium`}
      style={width ? { width } : undefined}
    >
      {children}
    </th>
  );
};

const TableCell = ({
  children,
  align = 'left',
  width,
  preserveLineBreaks = false,
}) => {
  const alignClass =
    {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align] || 'text-left';

  return (
    <td
      className={`border border-gray-200 px-2 py-1 ${alignClass} ${
        preserveLineBreaks ? 'whitespace-pre-line' : ''
      }`}
      style={width ? { width } : undefined}
    >
      {children}
    </td>
  );
};

const DataTables = ({ data, location, basicHours }) => {
  return (
    <>
      <Table
        data={data}
        type='kango'
        location={location}
        basicHours={basicHours}
      />
      <Table
        data={data}
        type='kaigo'
        location={location}
        basicHours={basicHours}
      />
      <Table
        data={data}
        type='yuryo'
        location={location}
        basicHours={basicHours}
      />
    </>
  );
};

const Table = ({ data, type, location, basicHours }) => {
  // Column configuration: width in pixels and alignment
  const columnConfig = [
    { width: 150, align: 'left', header: '氏名' },
    { width: 100, align: 'center', header: '雇用形態' },
    { width: 90, align: 'right', header: '労働時間' },
    { width: 90, align: 'center', header: '常勤換算' },
    { width: 250, align: 'left', header: '備考' },
  ];
  const totalTableWidth = columnConfig.reduce((sum, col) => {
    return sum + (typeof col.width === 'number' ? col.width : 0);
  }, 0);

  const rows =
    data && data['facility'][location] && data['facility'][location][type]
      ? data['facility'][location][type].staffs
      : [];
  const titleMap = { kaigo: '介護', kango: '看護', yuryo: '有料' };

  // Background color for table headers based on type
  const headerBgColorMap = {
    kaigo: 'bg-kaigo',
    kango: 'bg-kango',
    yuryo: 'bg-yuryo',
  };
  const headerBgColor = headerBgColorMap[type] || 'bg-gray-100';
  const workingHours = rows.reduce((acc, { working_hours: w }) => acc + w, 0);
  // Calculate totalRatio as sum of working_hours divided by basicHours
  const totalRatio = basicHours > 0 ? workingHours / basicHours : 0;
  const fullTime = rows.filter(
    ({ employment_type }) => employment_type === '正社員'
  ).length;
  const partTime = rows.filter(
    ({ employment_type }) => employment_type === 'パート'
  ).length;

  return (
    <div className='mb-8'>
      <h3 className={`text-lg font-bold mb-4 text-left bg-(--color-${type})`}>
        {titleMap[type]}
      </h3>
      {!rows?.length ? (
        <div className='flex-auto min-w-0.3'>データがありません。</div>
      ) : (
        <div className='flex gap-2 mb-4'>
          <div className='flex flex-col gap-2 w-[180px] flex-shrink-0 min-w-0'>
            <Card label='社員' value={rows.length} className='w-full' />
            <Card label='正社員' value={fullTime} className='w-full' />
            <Card label='パート' value={partTime} className='w-full' />
            <Card
              label='労働時間'
              value={workingHours.toFixed(2)}
              className='w-full'
            />
            <Card
              label='常勤換算'
              value={totalRatio.toFixed(2)}
              className='w-full'
            />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='overflow-x-auto'>
              <table
                className='table-fixed bg-white border border-gray-200'
                style={{ width: `${totalTableWidth}px`, maxWidth: '100%' }}
              >
                <thead>
                  <tr className={headerBgColor}>
                    {columnConfig.map((col, idx) => (
                      <TableHeader
                        key={idx}
                        align={col.align}
                        width={col.width}
                      >
                        {col.header}
                      </TableHeader>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.termination_date ? 'bg-gray-100' : 'bg-white'
                      }
                    >
                      <TableCell
                        align={columnConfig[0].align}
                        width={columnConfig[0].width}
                      >
                        {String(row.name ?? '')}
                      </TableCell>
                      <TableCell
                        align={columnConfig[1].align}
                        width={columnConfig[1].width}
                      >
                        {String(row.employment_type ?? '')}
                      </TableCell>
                      <TableCell
                        align={columnConfig[2].align}
                        width={columnConfig[2].width}
                      >
                        {String(row.working_hours?.toFixed(2) ?? '')}
                      </TableCell>
                      <TableCell
                        align={columnConfig[3].align}
                        width={columnConfig[3].width}
                      >
                        {basicHours > 0
                          ? (row.working_hours / basicHours).toFixed(2)
                          : ''}
                      </TableCell>
                      <TableCell
                        align={columnConfig[4].align}
                        width={columnConfig[4].width}
                        preserveLineBreaks={true}
                      >
                        {(() => {
                          const remarks = [];

                          // Get period_start from data
                          const periodStart = data?.period_start
                            ? parse(data.period_start, 'yyyy/MM/dd', new Date())
                            : null;

                          // 1. Check if start_date is the same as period_start or in the future
                          if (row.start_date) {
                            const startDate = parse(
                              row.start_date,
                              'MM/dd/yyyy',
                              new Date()
                            );
                            if (
                              (periodStart &&
                                isSameDay(startDate, periodStart)) ||
                              (periodStart &&
                                isAfter(startDate, periodStart)) ||
                              isFuture(startDate)
                            ) {
                              const formattedDate = format(startDate, 'MM/dd');
                              remarks.push(`【入社】${formattedDate}`);
                            }
                          }

                          // 2. Check if termination_date is the same as period_start or in the future
                          if (row.termination_date) {
                            const terminationDate = parse(
                              row.termination_date,
                              'MM/dd/yyyy',
                              new Date()
                            );
                            if (
                              (periodStart &&
                                isSameDay(terminationDate, periodStart)) ||
                              (periodStart &&
                                isAfter(terminationDate, periodStart)) ||
                              isFuture(terminationDate)
                            ) {
                              const formattedDate = format(
                                terminationDate,
                                'MM/dd'
                              );
                              remarks.push(`【退職】${formattedDate}`);
                            }
                          }

                          // 3. Check if leave_type is not empty
                          if (
                            row.leave_types &&
                            String(row.leave_types).trim() !== ''
                          ) {
                            remarks.push(String(row.leave_types));
                          }

                          return remarks.join('\n');
                        })()}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTables;
