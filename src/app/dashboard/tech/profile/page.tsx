import { auth } from "@/auth";
import { TechProfileClient } from "@/components/tech/tech-profile-client";

export default async function Page() {
  const session = await auth();

  return (
    <TechProfileClient
      userName={session?.user?.name ?? "Teknisyen"}
      userEmail={session?.user?.email ?? ""}
    />
  );
}
