import "server-only";
import { parseEnv } from "./schema";

export const env = parseEnv(process.env);
