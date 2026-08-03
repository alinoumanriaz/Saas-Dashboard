import { DatabaseType, WebsiteStatus } from "@/enums/common.enums";


export interface DatabaseConfig {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface CloudinaryConfig {
  folderName: string;
  cloudinaryName: string;
  cloudinaryNameApiKey: string;
  cloudinaryNameApiSecret: string;
}

export interface Website {
  id: string;
  name: string;
  domain: string;
  status: WebsiteStatus;
  database: DatabaseConfig;
  cloudinary: CloudinaryConfig;
}
