import { getScanReports } from "@/api/scanreports";
import { LoginButton, LogoutButton } from "@/auth/login";
import { options } from "@/auth/options";
import { getServerSession } from "next-auth";

export default async function Default() {
  const session = await getServerSession(options);

  const username = session?.token.user?.username;

  const scanreports = await getScanReports(undefined);

  return (
    <>
      User: {username}
      {session ? <LogoutButton /> : <LoginButton />}
      {scanreports?.count}
    </>
  );
}
