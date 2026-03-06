import React from 'react';
import type { CustomLabelProps } from '../../../types';

const CustomLabel: React.FC<CustomLabelProps> = ({ x, y, value, stroke, precision = 2 }) => {
  if (value === null || value === undefined || !x || !y) return null;

  const formattedValue = typeof value === 'number'
    ? value < 1 
      ? value.toFixed(Math.max(precision, 3)) 
      : value.toFixed(precision)
    : value;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 20} stroke={stroke} strokeWidth={1} strokeOpacity={0.3} />
      <text x={x} y={y - 25} fill={stroke} fontSize={11} textAnchor="middle" fontWeight={600}>
        {formattedValue}
      </text>
    </g>
  );
};

export default CustomLabel;