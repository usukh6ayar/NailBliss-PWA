export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const calculateProgress = (points: number): number => {
  return Math.min(points % 5, 5);
};

export const isRewardReady = (points: number): boolean => {
  return points > 0 && points % 5 === 0;
};

export const getTimeRemaining = (timestamp: number): number => {
  const now = Date.now();
  const elapsed = now - timestamp;
  const remaining = 60000 - elapsed; // 60 seconds in ms
  return Math.max(0, Math.ceil(remaining / 1000));
};