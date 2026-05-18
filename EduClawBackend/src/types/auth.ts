export type UserRole = "student" | "faculty" | "advisor" | "admin" | "auditor";

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}

export interface JwtAccessPayload {
  sub: string;
  roles: UserRole[];
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string;
  type: "refresh";
  jti: string;
}
