declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    authUser?: {
      id: string;
      roles: ("student" | "faculty" | "advisor" | "admin" | "auditor")[];
    };
  }
}

export {};
