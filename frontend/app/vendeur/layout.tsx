export const dynamic = "force-dynamic";

import VendorLayoutClient from "./VendorLayoutClient";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorLayoutClient>{children}</VendorLayoutClient>;
}
