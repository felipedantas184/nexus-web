// components/debug/DataCard.tsx
import React, { useState } from 'react';

interface DataCardProps {
  title: string;
  data: any;
  level?: number;
}

export const DataCard: React.FC<DataCardProps> = ({ title, data, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  
  if (data === null || data === undefined) {
    return <div className="text-gray-400">null</div>;
  }

  if (typeof data !== 'object') {
    return (
      <div className="font-mono text-sm">
        <span className="text-gray-600">{title}:</span>{' '}
        <span className="text-blue-600">{String(data)}</span>
      </div>
    );
  }

  return (
    <div className={`border-l-2 ${level === 0 ? 'border-blue-200' : 'border-gray-200'} pl-3 mb-2`}>
      <div 
        className="flex items-center cursor-pointer hover:bg-gray-50 rounded py-1"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="mr-1 text-gray-500">{expanded ? '▼' : '▶'}</span>
        <span className="font-medium text-gray-700">{title}</span>
        <span className="ml-2 text-xs text-gray-500">
          ({Array.isArray(data) ? data.length : Object.keys(data).length} itens)
        </span>
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <DataCard key={key} title={key} data={value} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};