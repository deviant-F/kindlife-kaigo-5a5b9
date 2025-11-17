import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

const SummaryDashboard = ({ data, locationMap, basicHours }) => {
  // Helper function to format value: show "-" in grey if 0, otherwise show the value
  const formatValue = (value) => {
    if (value === 0 || value === null || value === undefined) {
      return <span className='text-gray-300'>―</span>;
    }
    return value;
  };

  if (!data || !data.facility) {
    return <p>No summary data available.</p>;
  }

  const locations = Object.keys(data.facility);
  const types = ['kango', 'kaigo', 'yuryo'];
  const titleMap = { kaigo: '介護', kango: '看護', yuryo: '有料' };

  // Calculate aggregated data for each location
  const locationData = locations.map((locationKey) => {
    const locationFacility = data.facility[locationKey] || {};
    let totalWorkingHours = 0;
    const typeData = {};

    types.forEach((type) => {
      const typeFacility = locationFacility[type];
      if (typeFacility && typeFacility.staffs) {
        const staffs = typeFacility.staffs;
        const fullTime = staffs.filter(
          ({ employment_type }) => employment_type === '正社員'
        ).length;
        const partTime = staffs.filter(
          ({ employment_type }) => employment_type === 'パート'
        ).length;
        const workingHours = staffs.reduce(
          (acc, { working_hours: w }) => acc + (w || 0),
          0
        );
        const workingEquivalent =
          basicHours > 0 ? workingHours / basicHours : 0;

        totalWorkingHours += workingHours;

        // For yuryo type, calculate additional categories
        let nightShift = 0;
        let culinary = 0;
        let cleaning = 0;

        if (type === 'yuryo') {
          nightShift = staffs.filter(
            ({ employment_type }) => employment_type === '宿直'
          ).length;
          culinary = staffs.filter(
            ({ employment_type }) => employment_type === '調理'
          ).length;
          cleaning = staffs.filter(
            ({ employment_type }) => employment_type === '清掃'
          ).length;
        }

        typeData[type] = {
          count: staffs.length,
          fullTime,
          partTime,
          workingHours,
          workingEquivalent,
          nightShift,
          culinary,
          cleaning,
        };
      } else {
        typeData[type] = {
          count: 0,
          fullTime: 0,
          partTime: 0,
          workingHours: 0,
          workingEquivalent: 0,
          nightShift: 0,
          culinary: 0,
          cleaning: 0,
          percentage: null,
        };
      }
    });

    const totalWorkingEquivalent =
      basicHours > 0 ? totalWorkingHours / basicHours : 0;

    // Get bedcount if available (check various possible locations)
    const bedcount = locationFacility.beds || null;

    // Calculate percentage for each type: (type_workingEquivalent / 床数) * 100
    types.forEach((type) => {
      const typeWorkingEquivalent = typeData[type]?.workingEquivalent || 0;
      const typePercentage =
        bedcount && bedcount > 0 && typeWorkingEquivalent > 0
          ? (typeWorkingEquivalent / bedcount) * 100
          : null;
      typeData[type].percentage = typePercentage;
    });

    // Calculate total percentage: (常勤換算 / 床数) * 100
    const workingEquivalentPercentage =
      bedcount && bedcount > 0 && totalWorkingEquivalent > 0
        ? (totalWorkingEquivalent / bedcount) * 100
        : null;

    // Calculate sum of 看護 and 介護 percentages
    const kangoKaigoSum =
      (typeData.kango?.percentage || 0) + (typeData.kaigo?.percentage || 0);
    const kangoKaigoSumPercentage = kangoKaigoSum > 0 ? kangoKaigoSum : null;

    // Calculate sum of all three types percentages
    const allTypesSum =
      (typeData.kango?.percentage || 0) +
      (typeData.kaigo?.percentage || 0) +
      (typeData.yuryo?.percentage || 0);
    const allTypesSumPercentage = allTypesSum > 0 ? allTypesSum : null;

    return {
      locationKey,
      locationName: locationMap[locationKey] || locationKey,
      bedcount,
      typeData,
      totalWorkingEquivalent,
      workingEquivalentPercentage,
      kangoKaigoSumPercentage,
      allTypesSumPercentage,
    };
  });

  // Define columns using TanStack Table with column groups
  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: 'locationName',
        header: '施設名',
        size: 120,
        align: 'left',
      },
      {
        accessorKey: 'bedcount',
        header: '床数',
        size: 40,
        align: 'center',
        cell: ({ getValue }) => formatValue(getValue()),
      },
    ];

    // Add column groups for each type
    types.forEach((type) => {
      const typeColumns = [
        {
          accessorKey: `typeData.${type}.count`,
          header: '人数',
          size: 40,
          align: 'center',
          cell: ({ getValue }) => formatValue(getValue()),
        },
        {
          accessorKey: `typeData.${type}.fullTime`,
          header: '正社員',
          size: 40,
          align: 'center',
          cell: ({ getValue }) => formatValue(getValue()),
        },
        {
          accessorKey: `typeData.${type}.partTime`,
          header: 'パート',
          size: 40,
          align: 'center',
          cell: ({ getValue }) => formatValue(getValue()),
        },
      ];

      // Add additional columns for yuryo type
      if (type === 'yuryo') {
        typeColumns.push(
          {
            accessorKey: 'typeData.yuryo.nightShift',
            header: '宿直',
            size: 40,
            align: 'center',
            cell: ({ getValue }) => formatValue(getValue()),
          },
          {
            accessorKey: 'typeData.yuryo.culinary',
            header: '調理',
            size: 40,
            align: 'center',
            cell: ({ getValue }) => formatValue(getValue()),
          },
          {
            accessorKey: 'typeData.yuryo.cleaning',
            header: '清掃',
            size: 40,
            align: 'center',
            cell: ({ getValue }) => formatValue(getValue()),
          }
        );
      }

      typeColumns.push(
        {
          accessorKey: `typeData.${type}.workingEquivalent`,
          header: '常勤換算',
          size: 60,
          align: 'center',
          cell: ({ getValue }) => {
            const value = getValue();
            return value > 0 ? value.toFixed(2) : formatValue(0);
          },
        },
        {
          accessorKey: `typeData.${type}.percentage`,
          header: '常勤(%)',
          size: 40,
          align: 'center',
          cell: ({ getValue }) => {
            const value = getValue();
            if (value === null || value === undefined) {
              return formatValue(null);
            }
            return `${Math.round(value)}%`;
          },
        }
      );

      // Create column group with parent header
      cols.push({
        header: titleMap[type],
        columns: typeColumns,
      });
    });

    // Add sum columns grouped under parent header "常勤(%)"
    const sumColumns = [
      {
        accessorKey: 'kangoKaigoSumPercentage',
        header: '看護+介護',
        size: 100,
        align: 'center',
        cell: ({ getValue }) => {
          const value = getValue();
          if (value === null || value === undefined) {
            return formatValue(null);
          }
          return `${Math.round(value)}%`;
        },
      },
      {
        accessorKey: 'allTypesSumPercentage',
        header: '看護+介護+有料',
        size: 100,
        align: 'center',
        cell: ({ getValue }) => {
          const value = getValue();
          if (value === null || value === undefined) {
            return formatValue(null);
          }
          return `${Math.round(value)}%`;
        },
      },
      {
        accessorKey: 'workingEquivalentPercentage',
        header: '総合',
        size: 70,
        align: 'center',
        cell: ({ getValue }) => {
          const value = getValue();
          if (value === null || value === undefined) {
            return formatValue(null);
          }
          return `${Math.round(value)}%`;
        },
      },
    ];

    // Create column group with parent header "常勤(%)"
    cols.push({
      header: '常勤総合',
      columns: sumColumns,
    });

    return cols;
  }, [titleMap, types]);

  const table = useReactTable({
    data: locationData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className=''>
      <h2 className='text-2xl font-bold mb-4'>全体一覧</h2>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200'>
          <thead>
            {table.getHeaderGroups().map((headerGroup, groupIndex) => {
              const isFirstRow = groupIndex === 0;
              const totalHeaderRows = table.getHeaderGroups().length;

              return (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    // Skip rendering if this is a child header in the first row
                    // (it will be rendered as part of parent's subHeaders)
                    if (isFirstRow && header.column.parent) {
                      return null;
                    }

                    const column = header.column.columnDef;
                    const alignClass =
                      {
                        left: 'text-left',
                        center: 'text-center',
                        right: 'text-right',
                      }[column.align || 'left'] || 'text-left';

                    // Calculate colspan for parent headers (column groups)
                    const colSpan = header.subHeaders?.length || 1;
                    // Calculate rowSpan for regular columns (no subHeaders) in first row
                    const rowSpan =
                      isFirstRow && !header.subHeaders?.length
                        ? totalHeaderRows
                        : 1;
                    // Parent headers are in the first row and have subHeaders
                    const isParentHeader =
                      isFirstRow && header.subHeaders?.length > 0;

                    // Determine theme color for parent headers
                    let headerStyle = { width: column.size };
                    let headerClassName = `border border-gray-200 px-3 py-2 ${alignClass} text-gray-700 font-medium`;

                    if (isParentHeader) {
                      // Get the header text to determine the type
                      const headerText = column.header;
                      // Find which type this header belongs to
                      const typeKey = Object.keys(titleMap).find(
                        (key) => titleMap[key] === headerText
                      );
                      if (typeKey) {
                        // Apply CSS variable color
                        headerStyle.backgroundColor = `var(--color-${typeKey})`;
                        headerClassName += ' font-semibold';
                      } else {
                        headerClassName += ' bg-gray-100';
                      }
                    } else {
                      headerClassName += ' bg-gray-50';
                    }

                    return (
                      <th
                        key={header.id}
                        colSpan={colSpan}
                        rowSpan={rowSpan}
                        className={headerClassName}
                        style={headerStyle}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {row.getVisibleCells().map((cell) => {
                  const column = cell.column.columnDef;
                  const alignClass =
                    {
                      left: 'text-left',
                      center: 'text-center',
                      right: 'text-right',
                    }[column.align || 'left'] || 'text-left';

                  return (
                    <td
                      key={cell.id}
                      className={`border border-gray-200 px-3 py-2 ${alignClass}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryDashboard;
