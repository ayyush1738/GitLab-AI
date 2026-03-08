import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useAuth() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          withCredentials: true,
        });
        return res.data; // { logged_in: true, user: { role: 'manager', ... } }
      } catch (err) {
        return { logged_in: false };
      }
    },
    staleTime: 5 * 60 * 1000, // Only check identity every 5 mins
  });
}