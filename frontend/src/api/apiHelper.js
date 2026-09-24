// Function to help handle api calls to the backend easily from the frontend

const API_BASE = "http://localhost:5000";

// Function to handle a request to the backend with the given endpoint and data
export async function apiRequest(endpoint, method = "GET", body = null) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || "API request failed");
        error.body = errorData;
        throw error;
    }

    return response.json();
}
