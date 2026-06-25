import { Admin, Organisation } from "../generated/prisma/client";

declare global {
    namespace Express {
        interface Request {
            admin?: Omit<Admin, 'password'>
            org?: Organisation
        }
    }
}