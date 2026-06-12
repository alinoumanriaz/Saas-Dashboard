import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is missing");
}

const secret = new TextEncoder().encode(jwtSecret.trim());

export const publicPaths = ["/auth/sign_in", "/auth/sign_up", "/auth/forget_password"];

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;

  console.log({ token, pathname });

  const isPublicPath = publicPaths.includes(pathname);

  if (!token) {
    if (isPublicPath) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/auth/sign_in", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    console.log({ payload });

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const response = NextResponse.redirect(new URL("/auth/sign_in", req.url));

      response.cookies.set("auth-token", "", {
        maxAge: 0,
        path: "/",
      });

      return response;
    }
    if (isPublicPath) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/user") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Invalid token:", err);

    const response = NextResponse.redirect(new URL("/auth/sign_in", req.url));

    response.cookies.set("auth-token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|api)).*)",
  ],
};