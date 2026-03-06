import { useState, useMemo, useCallback } from 'react';

// ไม่ต้องรับ labels แล้ว ให้รับ dataKey แทน (ค่า default คือ 'name')
export const useChartZoom = (data: any[], xDataKey: string = 'name') => {
  const [zoomState, setZoomState] = useState<{ left: string; right: string } | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

  // 1. สร้าง labels จากข้อมูลจริง เพื่อให้ตรงกับ activeLabel ของกราฟแน่นอน 100%
  const dataLabels = useMemo(() => {
    return data.map(item => item[xDataKey]);
  }, [data, xDataKey]);

  const onMouseDown = useCallback((e: any) => {
    if (e && e.activeLabel) {
      setRefAreaLeft(e.activeLabel);
    }
  }, []);

  const onMouseMove = useCallback((e: any) => {
    // ต้องมีจุดเริ่มก่อน ถึงจะขยับจุดจบได้
    if (refAreaLeft && e && e.activeLabel) {
      setRefAreaRight(e.activeLabel);
    }
  }, [refAreaLeft]);

  const onMouseUp = useCallback(() => {
    if (refAreaLeft && refAreaRight) {
      // 2. หา index จาก dataLabels ที่เราสร้างเอง (เจอแน่นอน)
      const leftIndex = dataLabels.indexOf(refAreaLeft);
      const rightIndex = dataLabels.indexOf(refAreaRight);

      if (leftIndex !== -1 && rightIndex !== -1 && leftIndex !== rightIndex) {
        // เรียงลำดับ น้อยไปมาก (เผื่อลากย้อนหลัง)
        let [min, max] = [leftIndex, rightIndex].sort((a, b) => a - b);

        // บันทึกค่าที่ซูม (ใช้ค่าจาก label จริงๆ)
        setZoomState({
          left: dataLabels[min],
          right: dataLabels[max]
        });
      }
    }
    // ล้างค่าแถบสีฟ้า
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, [refAreaLeft, refAreaRight, dataLabels]);

  const resetZoom = useCallback(() => {
    setZoomState(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  }, []);

  const visibleData = useMemo(() => {
    // ถ้าไม่ได้ซูม ให้ส่งข้อมูลทั้งหมด
    if (!zoomState) return data;

    const leftIndex = dataLabels.indexOf(zoomState.left);
    const rightIndex = dataLabels.indexOf(zoomState.right);

    // กันเหนียว: ถ้าหาไม่เจอให้คืนข้อมูลทั้งหมด
    if (leftIndex === -1 || rightIndex === -1) return data;

    // ตัดข้อมูลส่งกลับไป
    return data.slice(leftIndex, rightIndex + 1);
  }, [zoomState, data, dataLabels]);

  return {
    zoomProps: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
    isZoomed: !!zoomState,
    resetZoom,
    refAreaLeft,
    refAreaRight,
    visibleData,
  };
};