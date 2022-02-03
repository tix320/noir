export function retrieveToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

export function storeToken(token, permanent) {
    const storage = permanent ? localStorage : sessionStorage;
    storage.setItem("token", token);
}

export function removeToken() {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
}