import type { Schema } from "./resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock Runtime Client
const client = new BedrockRuntimeClient();

export const handler: Schema["generateHaiku"]["functionHandler"] = async (
  event,
  context
) => {
  // User prompt and chat history
  const prompt = event.arguments.prompt;
  const chatHistory = event.arguments.chatHistory ? JSON.parse(event.arguments.chatHistory) : [];

  // Prepare messages for the model
  const messages = [];
  let lastRole: "user" | "assistant" | null = null;

  // Iterate through chat history
  chatHistory.forEach((entry: { user: string; bot?: string }) => {
    const currentRole = lastRole === "user" ? "assistant" : "user";

    // Add message to the array
    if (entry.user) {
      messages.push({
        role: currentRole,
        content: [{ type: "text", text: entry.user }]
      });
    }

    // Toggle role for next entry
    lastRole = currentRole;
  });

  // Add the current prompt as a user message
  messages.push({
    role: "user",
    content: [{ type: "text", text: prompt }]
  });

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system: "You are an Amazon Chef Chatbot. A friendly chatbot that can help amazon fresh customers with auto suggesting recipes and grocery items based on customer preference such as budget, allergy etc",
      messages,
      max_tokens: 1000000,
      temperature: 0.5,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  const response = await client.send(command);

  const data = JSON.parse(Buffer.from(response.body).toString());

  return data.content[0].text;
};
