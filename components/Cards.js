const Card = ({ label, value, subValue, className }) => {
  const baseClasses = [
    'p-4',
    'bg-white',
    'rounded-sm',
    'border-1',
    'border-solid',
    'border-gray-200',
  ];
  if (className) {
    if (Array.isArray(className)) {
      baseClasses.push(...className);
    } else {
      baseClasses.push(className);
    }
  }
  return (
    <div className={baseClasses.join(' ')}>
      <div className='text-sm text-gray-500'>{label}</div>
      <div className='text-2xl font-bold'>{value}</div>
      {subValue && <div className='text-sm text-gray-500'>{subValue}</div>}
    </div>
  );
};

export default Card;
