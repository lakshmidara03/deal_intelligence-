"use server";

import { revalidatePath } from "next/cache";

export async function syncDealSignals() {
  revalidatePath("/dashboard");
  revalidatePath("/deals");
  return { ok: true, syncedAt: new Date().toISOString() };
}
