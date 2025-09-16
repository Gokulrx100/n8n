import BaseNode from "../BaseNode";
import { MousePointerClick } from "lucide-react";

export default function ManualTriggerNode() {
  return <BaseNode title="Manual Trigger" icon={<MousePointerClick size={28} />} bg="bg-green-600" type="trigger" />;
}