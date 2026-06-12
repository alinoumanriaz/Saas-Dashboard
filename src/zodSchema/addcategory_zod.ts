import { z } from "zod";

export const addcategory_zodSchame = z.object({
  name: z.string().min(2, { message: "Name must be atleast 2 character" }),
});
