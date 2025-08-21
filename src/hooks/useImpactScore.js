import { useState, useEffect } from 'react';

export const useImpactScore = (userId) => {
  const [impactScore, setImpactScore] = useState(0);
  const [statistics, setStatistics] = useState({
    totalBookings: 0,
    totalClaimed: 0,
    totalCancelled: 0,
    totalCompleted: 0,
    positiveActions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImpactScore = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/impact-score/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setImpactScore(data.data.impactScore);
        setStatistics(data.data.statistics);
      } else {
        setError(data.error || 'Failed to fetch impact score');
      }
    } catch (err) {
      console.error('Error fetching impact score:', err);
      setError('Failed to fetch impact score');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactScore();
  }, [userId]);

  return {
    impactScore,
    statistics,
    isLoading,
    error,
    refetch: fetchImpactScore
  };
};
