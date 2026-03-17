export const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});

