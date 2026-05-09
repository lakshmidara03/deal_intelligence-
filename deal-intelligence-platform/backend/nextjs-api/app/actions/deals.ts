"use server";

import { revalidatePath } from "next/cache";

export async function revalidateDeals() {
  revalidatePath("/api/deals");
  return { ok: true };
}
