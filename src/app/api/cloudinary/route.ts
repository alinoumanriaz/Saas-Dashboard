import { NextResponse } from "next/server";
import axios from "axios";
import cloudinary from "@/helpers/cloudinary";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "uniquecustomboxesmedia";
    if (!folder)
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );

    const response = await axios.get(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/search`,
      {
        params: {
          expression: `folder:${folder}`,
          max_results: 50,
          next_cursor: searchParams.get("next_cursor") || undefined,
        },
        auth: {
          username: process.env.CLOUDINARY_API_KEY || "",
          password: process.env.CLOUDINARY_API_SECRET || "",
        },
      }
    );

    return NextResponse.json({
      images: response.data.resources,
      next_cursor: response.data.next_cursor || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { public_ids, folder } = body;

    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return NextResponse.json(
        { error: "public_ids array is required" },
        { status: 400 }
      );
    }
    if (!folder)
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );

    const results = await Promise.all(
      public_ids.map((id) => cloudinary.uploader.destroy(id))
    );
    console.log({ delresult: results });

    return NextResponse.json({
      message: `${public_ids.length} images deleted successfully`,
      results,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete images" },
      { status: 500 }
    );
  }
}
