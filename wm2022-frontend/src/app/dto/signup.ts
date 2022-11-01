export interface SignupRequest {
    username: string;
    password: string;
    code: string;
}

export interface SignupResponse {
    token: string;
}