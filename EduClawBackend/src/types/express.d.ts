declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    authUser?: {
      id: string;
      roles: ("student" | "faculty" | "advisor" | "admin" | "auditor")[];
    };
    traceContext?: {
      traceId: string;
      spanId: string;
      parentSpanId: string | null;
      sampled: boolean;
    };
  }
}

export {};
