// src/app/api/create-user/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  roleId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { email, password, name, roleId } = validation.data;

    // 1. Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    
    // 2. Set custom claim for high-level role (e.g., employee)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'employee' });

    // 3. Create user document in Firestore "users" collection
    await adminDb.collection("users").doc(userRecord.uid).set({
      name,
      email,
      roleId,
    });

    return NextResponse.json({
      message: "User created successfully",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Provide more specific error messages
    if (error.code === 'auth/email-already-exists') {
         return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
