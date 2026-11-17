
const API_URL = "http://localhost:3000/api";

export async function apiRequest(endpoint) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || "Gagal mengambil data");
  }

  return result.data;
}
