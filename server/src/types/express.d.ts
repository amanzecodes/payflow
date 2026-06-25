import { Organisation } from "../generated/prisma/client";

declare global {
    namespace Express {
        interface Request {
            org?: Organisation
        }
    }
}