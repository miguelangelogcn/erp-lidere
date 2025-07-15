
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

    // We get the role name to set it as a custom claim. This is useful for backend security rules.
    const roleDoc = await adminDb.collection("roles").doc(roleId).get();
    if (!roleDoc.exists) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
    }
    const roleName = roleDoc.data()?.name.toLowerCase();

    // 1. Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    
    // 2. Set custom claim for role (useful for securing Firebase Storage/Firestore from the client)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: roleName });

    // 3. Create user document in Firestore "users" collection
    await adminDb.collection("users").doc(userRecord.uid).set({
      name,
      email,
      roleId,
      assignedCourses: [],
    });

    return NextResponse.json({
      message: "User created successfully",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 'auth/email-already-exists') {
         return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
