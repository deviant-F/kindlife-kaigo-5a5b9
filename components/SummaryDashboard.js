import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Chart.js components with SSR disabled
const Doughnut = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Doughnut),
  {
    ssr: false,
  }
);

const beds = {
  umebayashi: 27,
  rokujyo: 31,
  ogakishi: 30,
  kanezawa: 34,
  nigata: 29,
  toyama: 40,
  kusatsu: 44,
  hikone: 33,
  moriokanishi: 54,
  morioka: 40,
  tsushinmachi: 35,
  toyamaokuda: 52,
  fukushima: 37,
};

const SummaryDashboard = ({ data, locationMap }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    // Register Chart.js components on client side only
    if (typeof window !== 'undefined') {
      import('chart.js').then((ChartJS) => {
        ChartJS.Chart.register(
          ChartJS.ArcElement,
          ChartJS.Tooltip,
          ChartJS.Legend
        );
        setIsChartReady(true);
      });
    }
  }, []);

  if (!data || !data.details) {
    return <p>No summary data available.</p>;
  }

  const locations = Object.keys(data.details);
  const types = ['kango', 'kaigo', 'yuryo'];
  const titleMap = { kaigo: '介護', kango: '看護', yuryo: '有料' };

  // Calculate totals for each location and type
  const summaryData = locations.map((location) => {
    const locationData = data.details[location];
    const summary = {
      location,
      types: {},
      bedRatio: 0,
    };

    types.forEach((type) => {
      if (locationData[type] && locationData[type].staffs) {
        const staffs = locationData[type].staffs;
        const totalRatio = staffs.reduce(
          (acc, { equivalent_ratio: r }) => acc + r,
          0
        );
        const workingHours = staffs.reduce(
          (acc, { working_hours: w }) => acc + w,
          0
        );
        const fullTime = staffs.filter(
          ({ employment_type }) => employment_type === '正社員'
        ).length;
        const partTime = staffs.filter(
          ({ employment_type }) => employment_type === 'パート'
        ).length;

        summary.types[type] = {
          total: staffs.length,
          fullTime,
          partTime,
          workingHours,
          totalRatio,
        };
      }
    });

    return summary;
  });

  return (
    <div className=''>
      <h2 className='text-2xl font-bold mb-4'>全体一覧</h2>

      {/* Summary cards for each type across all locations */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4 mb-8'>
        {summaryData.map((locData) => {
          // Get totalRatio for all three types
          const totalRatios = types.map((t) => {
            const td = locData.types[t];
            if (!td) return 0;
            return td.totalRatio;
          });

          // Calculate total and bed ratio
          const totalRatio = totalRatios.reduce((sum, val) => sum + val, 0);
          const labels = [...types.map((t) => titleMap[t]), '空き'];
          const bedCount = beds[locData.location] || 0;
          const remainingCount =
            bedCount - totalRatios.reduce((sum, val) => sum + val, 0);
          const bedRatio = bedCount > 0 ? totalRatio / bedCount : 0;

          return (
            <div
              key={locData.location}
              className='bg-white border border-gray-200 rounded-lg p-4'
            >
              <div className='flex justify-between items-center'>
                <h3 className='text-xl font-bold text-gray-700'>
                  {locationMap?.[locData.location] || locData.location}
                </h3>
                <div className='border-1 border-solid border-gray-200 px-2 py-1'>
                  <span className='text-sm text-gray-500 mr-2'>床数</span>
                  <span className='text-lg font-semibold'>{bedCount}</span>
                </div>
              </div>
              {isChartReady && (
                <Doughnut
                  className='lg:max-h-[280px] xl:max-xl-[320px]'
                  data={{
                    labels,
                    datasets: [
                      {
                        data: [...totalRatios, remainingCount],
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(250, 224, 132, 0.8)',
                          'rgba(186, 235, 157, 0.8)',
                          'rgba(237, 237, 237, 0.8)',
                        ],
                        borderColor: [
                          'rgba(54, 162, 235, 1)',
                          'rgba(250, 224, 132, 1)',
                          'rgba(186, 235, 157, 1)',
                          'rgba(237, 237, 237, 1)',
                        ],
                        borderWidth: 1,
                        cutout: '70%',
                        hoverOffset: 10,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    layout: {
                      padding: {
                        top: 10,
                        bottom: 10,
                      },
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 20,
                          font: {
                            size: 14,
                          },
                        },
                      },
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed || 0;
                            // Calculate percentage relative to bed count
                            const percentage =
                              bedCount > 0
                                ? ((value / bedCount) * 100).toFixed(1)
                                : 0;
                            return `常勤換算: ${value.toFixed(
                              2
                            )} (${percentage}%)`;
                          },
                        },
                      },
                      // Custom plugin to display text in center
                      centerText: {
                        display: true,
                        text: `ベッド比\n${parseInt(bedRatio * 100)}%`,
                      },
                    },
                  }}
                  plugins={[
                    {
                      id: 'centerText',
                      afterDraw: function (chart) {
                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const centerX = (chartArea.left + chartArea.right) / 2;
                        const centerY = (chartArea.top + chartArea.bottom) / 2;

                        // Get the text and options from plugin options
                        const pluginOptions = chart.options.plugins?.centerText;
                        if (!pluginOptions || !pluginOptions.display) {
                          return;
                        }

                        const text = pluginOptions.text || '';
                        const lines = text.split('\n');

                        // Calculate vertical spacing
                        const lineHeight = 36;
                        const totalHeight = lines.length * lineHeight;
                        const startY =
                          centerY - totalHeight / 2 + lineHeight / 2;

                        lines.forEach((line, index) => {
                          // Save context for each line
                          ctx.save();

                          // First line (ベッド比) uses 16px, second line (percentage) uses 20px
                          const fontSize = index === 0 ? '16' : '36';

                          // Set font properties explicitly - ensure font size is a string
                          ctx.font = fontSize + 'px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillStyle = '#333';

                          const y = startY + index * lineHeight;
                          ctx.fillText(line, centerX, y);

                          // Restore context after each line
                          ctx.restore();
                        });
                      },
                    },
                  ]}
                  width={120}
                  height={120}
                />
              )}
              {/* Staff counts by type */}
              <div className='mt-4'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-1 text-gray-600 font-medium'></th>
                      <th className='text-center py-1 text-gray-600 font-medium'>
                        正社員
                      </th>
                      <th className='text-center py-1 text-gray-600 font-medium'>
                        パート
                      </th>
                      <th className='text-center py-1 text-gray-600 font-medium'>
                        合計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((type) => {
                      const typeData = locData.types[type];
                      if (!typeData) return null;
                      return (
                        <tr key={type} className='border-b border-gray-100'>
                          <td className='py-1 text-gray-700 font-medium'>
                            {titleMap[type]}
                          </td>
                          <td className='py-1 text-center text-gray-700 font-semibold'>
                            {typeData.fullTime}
                          </td>
                          <td className='py-1 text-center text-gray-700 font-semibold'>
                            {typeData.partTime}
                          </td>
                          <td className='py-1 text-center text-gray-700 font-semibold'>
                            {typeData.fullTime + typeData.partTime}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryDashboard;
