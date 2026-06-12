import z from "zod";

export const addProduct_zodSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  h1Tag: z.string().min(1, { message: "Slug is required" }),
  metaTitle: z.string().min(1, { message: "Slug is required" }),
  metaDescription: z.string().min(1, { message: "Slug is required" }),
});
