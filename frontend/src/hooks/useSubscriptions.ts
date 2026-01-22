import { useState, useCallback } from "react";
import {
  Subscription,
  CustomerSubscription,
  CreateSubscriptionDTO,
  CreateCustomerSubscriptionDTO,
  SubscriptionsSummary,
} from "../types/subscriptions";

// Helper básico de fetch (Mover a shared/api.ts en un proyecto real)
const API_BASE = "/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // Asumimos almacenamiento estándar
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const useSubscriptions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // Gastos (Expenses)
  // ==========================================

  const fetchExpenses = useCallback(
    async (filters?: { status?: string; category?: string }) => {
      setLoading(true);
      try {
        const query = new URLSearchParams(filters as any).toString();
        const res = await fetch(`${API_BASE}/subscriptions?${query}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Error fetching expenses");
        const data: { subscriptions: Subscription[] } = await res.json();
        return data.subscriptions ?? [];
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createExpense = useCallback(async (dto: CreateSubscriptionDTO) => {
    setLoading(true);
    try {
      const payload = {
        ...dto,
        startDate: dto.startDate?.slice(0, 10),
        trialStartDate: dto.trialStartDate?.slice(0, 10),
        trialEndDate: dto.trialEndDate?.slice(0, 10),
      };
      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error creating expense");
      }
        const data: Subscription = await res.json();
        return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // Ingresos (Revenue)
  // ==========================================

  const fetchRevenue = useCallback(
    async (filters?: { status?: string; clientId?: string }) => {
      setLoading(true);
      try {
        const query = new URLSearchParams(filters as any).toString();
        const res = await fetch(`${API_BASE}/customer-subscriptions?${query}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Error fetching revenue");
        const data: { subscriptions: CustomerSubscription[] } = await res.json();
        return data.subscriptions ?? [];
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/customer-subscriptions/summary`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error fetching summary");
      const data: SubscriptionsSummary = await res.json();
      return data;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }, []);

  const createRevenue = useCallback(
    async (dto: CreateCustomerSubscriptionDTO) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/customer-subscriptions`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(dto),
        });
        if (!res.ok) throw new Error("Error creating customer subscription");
        const data: CustomerSubscription = await res.json();
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const convertTrial = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/customer-subscriptions/${id}/convert`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error("Error converting trial");
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRevenue = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/customer-subscriptions/${id}/cancel`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error("Error cancelling subscription");
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchExpenses,
    createExpense,
    fetchRevenue,
    fetchSummary,
    createRevenue,
    convertTrial,
    cancelRevenue,
  };
};
