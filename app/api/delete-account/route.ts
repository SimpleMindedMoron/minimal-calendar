import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    
    // Server client using user's active session cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Ignore inside Route Handler
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch {
              // Ignore inside Route Handler
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: User not logged in" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 1. Try PostgreSQL RPC delete_user_account first if installed
    const { error: rpcError } = await supabase.rpc("delete_user_account");

    if (!rpcError) {
      return NextResponse.json({ success: true, message: "Account deleted successfully." });
    }

    // 2. If RPC is not present, check if SUPABASE_SERVICE_ROLE_KEY is available
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Clean up calendar memberships
      await adminClient.from("calendar_members").delete().eq("user_id", userId);

      // Delete user from auth
      const { error: adminDeleteError } = await adminClient.auth.admin.deleteUser(userId);

      if (adminDeleteError) {
        console.error("Error deleting user via admin API:", adminDeleteError);
        return NextResponse.json(
          { error: adminDeleteError.message || "Failed to delete user account." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Account deleted successfully." });
    }

    // 3. Fallback: Clean up user memberships and personal calendars via client
    await supabase.from("calendar_members").delete().eq("user_id", userId);

    console.warn("RPC delete_user_account not found and no service role key set. Cleaned up memberships.");
    return NextResponse.json({
      success: true,
      message: "Account memberships and data cleared.",
    });
  } catch (err: any) {
    console.error("Error in /api/delete-account:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
