import { DatabaseType, WebsiteStatus } from "@/enums/common.enums";


export interface DatabaseConfig {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface Website {
  name: string;
  domain: string;
  status: WebsiteStatus;
  database: DatabaseConfig;
}
