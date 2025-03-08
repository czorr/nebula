export const orchestrator = async (prompt) => {

  try {
    const response = await fetch("/api/strats/evaluate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  const data = await response.json();
  return data;

  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
  
};

