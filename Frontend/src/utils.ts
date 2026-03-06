export const generateColor = (index: number): string => {
  const hue = ((index * 137.5) % 360);
  return `hsl(${hue}, 70%, 50%)`;
};

export const useLineStyle = (hoveredLine: string | null, smoothTransition: boolean) => {
  return (key: string) => {
    let targetOpacity = 1;
    if (hoveredLine) targetOpacity = (hoveredLine === key) ? 1 : 0;
    return {
      strokeOpacity: targetOpacity,
      strokeWidth: (hoveredLine === key) ? 3.5 : 2,
      transition: smoothTransition ? 'stroke-opacity 0.4s ease-in-out, stroke-width 0.3s ease-in-out' : 'none'
    };
  };
};

