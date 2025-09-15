import BaseNode from "./BaseNode";
import { Send } from "lucide-react";

export default function TelegramActionNode() {
  return <BaseNode title="Telegram" icon={<Send size={28} />} bg="bg-blue-600" />;
}