import * as nodemailer from "nodemailer";
import axios from "axios";
import CredentialModel, { ICredential } from "../models/Credentials";
import { processTemplate } from "./executionService";

export async function executeEmailAction(node: any, context: any) {
  const { credentialId, to, subject, body } = node.data || {};
  
  if (!credentialId) {
    throw new Error("No email credential selected");
  }

  const credential: ICredential | null =
    await CredentialModel.findById(credentialId);
  if (!credential || credential.platform !== "email") {
      throw new Error("Email credential not found");
    }

  const { email: fromEmail, appPassword } = credential.data;
  if (!fromEmail || !appPassword) {
    throw new Error("Email credential missing email or app password");
  }

  const RawRecipient =
    to || context.triggerData?.email || context.triggerData?.body?.email;
  const RawSubject =
    subject ||
    context.triggerData?.subject ||
    context.triggerData?.body?.subject;
  const RawBody =
    body || context.triggerData?.message || context.triggerData?.body?.message;

  const processedRecipient = processTemplate(RawRecipient, context);
  const processedSubject = processTemplate(RawSubject, context);
  const processedBody = processTemplate(RawBody, context);

  if (!processedRecipient) {
    throw new Error("No recipient defined");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: fromEmail,
      pass: appPassword,
    },
  });

  const mailOptions = {
    from: fromEmail,
    to: processedRecipient,
    subject: processedSubject,
    html: processedBody.replace(/\n/g, "<br>"),
    text: processedBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

  return {
    success: true,
    data: {
      message: "Email sent successfully",
        messageId: info.messageId,
        from: fromEmail,
        to: processedRecipient,
      subject: processedSubject,
        sentAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function executeTelegramAction(node: any, context: any) {
  const { credentialId, chatId, message } = node.data || {};
  
  if (!credentialId) {
    throw new Error("No Telegram credential selected");
  }

  const credential: ICredential | null =
    await CredentialModel.findById(credentialId);
  if (!credential || credential.platform !== "telegram") {
    throw new Error("Telegram credential not found");
  }

  const { botToken } = credential.data;
  if (!botToken) {
    throw new Error("Bot token not configured in credential");
  }

  const RawChatId =
    chatId || context.triggerData?.chatId || context.triggerData?.body?.chatId;
  const RawMessage =
    message ||
    context.triggerData?.message ||
    context.triggerData?.body?.message;
  const processedChatId = processTemplate(RawChatId, context);
  const processedMessage = processTemplate(RawMessage, context);

  if (!processedChatId) {
    throw new Error("No chat ID specified");
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await axios.post(telegramApiUrl, {
      chat_id: processedChatId,
      text: processedMessage,
      parse_mode: "HTML",
    });

    const result = response.data;

    if (!result.ok) {
      throw new Error(result.description || "Failed to send Telegram message");
    }

    return {
      success: true,
      data: {
        message: "Telegram message sent successfully",
        messageId: result.result.message_id,
        chatId: processedChatId,
        text: processedMessage,
        sentAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    if (error.response) {
      const errorMsg =
        error.response.data?.description ||
        error.response.statusText ||
        "Telegram API error";
      throw new Error(`Telegram send failed: ${errorMsg}`);
    }
    throw new Error(
      `Telegram send failed: ${error.message || "Unknown error"}`
    );
  }
}