import BaseNode from "../BaseNode";
import { Mail } from "lucide-react";

export default function EmailActionNode() {
  return <BaseNode title="Gmail" icon={<Mail size={28} />} bg="bg-rose-600" />;
}