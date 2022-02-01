export function retrieveToken() {
    return localStorage.getItem("token");
}

export function storeToken(token) {
    localStorage.setItem("token", token);
}

export function removeToken() {
    return localStorage.removeItem("token");
}