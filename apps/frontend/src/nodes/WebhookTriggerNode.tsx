import BaseNode from "./BaseNode";
import { Link2 } from "lucide-react";

export default function WebhookTriggerNode() {
  return <BaseNode title="Webhook" icon={<Link2 size={28} />} bg="bg-indigo-600" type="trigger" />;
}