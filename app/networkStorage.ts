export const createNetworkStorage = (id: string) => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `/api/game/${id}?name=${encodeURIComponent(name)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch game state");
      }

      const data = await response.json();

      return data.state || null;
    } catch (error) {
      console.error("Error retrieving game state:", error);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await fetch(`/api/game/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, state: value }),
      });
    } catch (error) {
      console.error("Error saving game state:", error);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await fetch(`/api/game/${id}?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error removing game state:", error);
    }
  },
});
