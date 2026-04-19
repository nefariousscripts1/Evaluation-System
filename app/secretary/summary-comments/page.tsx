import { redirect } from "next/navigation";

export default function SummaryCommentsPage() {
  redirect("/secretary/reports?tab=comments");
}
