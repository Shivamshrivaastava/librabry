import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const connectionString = "postgresql://neondb_owner:npg_wo2ErX9NvBTO@ep-withered-sunset-a1t7kpsh-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
