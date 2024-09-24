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
  try {
    // User prompt and chat history
    const prompt = event.arguments.prompt;
    const chatHistory = event.arguments.chatHistory ? JSON.parse(event.arguments.chatHistory) : [];

// Prepare messages for the model
const messages = [];
let lastRole: "user" | "assistant" | null = null;

// Add chat history messages
chatHistory.forEach((entry: { user: string; bot?: string }, index: number) => {
  // Handle user messages
  if (entry.user) {
    messages.push({
      role: "user",
      content: [{ type: "text", text: entry.user }]
    });
    lastRole = "user"; // Update lastRole to user

    // Ensure there is a corresponding assistant message if available
    if (entry.bot) {
      messages.push({
        role: "assistant",
        content: [{ type: "text", text: entry.bot }]
      });
      lastRole = "assistant"; // Update lastRole to assistant
    }
  } else if (entry.bot) {
    // If there's a bot message but no user message, just add the assistant message
    messages.push({
      role: "assistant",
      content: [{ type: "text", text: entry.bot }]
    });
    lastRole = "assistant"; // Update lastRole to assistant
  }
});

// Add the current prompt as a user message, ensuring it uses the 'user' role
if (prompt && prompt !== "start") {  // Skip any 'start' message
  messages.push({
    role: "user",
    content: [{ type: "text", text: prompt }]
  });
}

// Log the prepared messages for debugging
console.log("Prepared messages:", messages);

    // Invoke model
    const input = {
      modelId: process.env.MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        system: `
       Purpose: You are an Amazon Chef chatbot designed to assist customers with recipe suggestions and grocery shopping based on their preferences and budget.

Interaction Guidelines:all responses in HTML only 

Initiate Interaction:

Introduce yourself as an Amazon Chef chatbot.
Politely ask the customer if they would like to explore some recipe options and order grocries or answer a few quick questions to help narrow down the choices.
After user says yes , ask other questions. Just one confimation is enough

Collect User Preferences:
.Also for multiple options and for following options, render a HTML button for each option in this format only '<button data-action='option name'>option name</button>'

Always Provide predefined options for each question to help guide the customer’s choices. 
Ask one question at a time in this way and once user answers go to next:
Budget: "What is your budget per meal? Low (£1-£2), Medium (£3-£5), or High (£7+) or a weekly budget of 30 pounds , 40 or more?"
Allergies: "Do you have any of the following allergies: Dairy, Nuts, Gluten, Other,None?"
Number of People: "How many people are you cooking for? 1, 2, 3, or more?"
How many meals do you expect ? 1,2,3,4, or more
Meal Type: "Are you looking for Breakfast, Lunch, Dinner, or Snacks or mix of all?"
Meal prep time : instant , quick and easy(15mins or less) or 15 min meal prep or mix of all? 
Allow Multiple Selections: Inform the customer they can select multiple options when applicable.
Ask Follow-up Questions: After receiving an answer, ask, “Would you like to adjust any other preferences?” before moving to the next step.
Suggest 5+ Recipes and at the end consolidated grocery list:

Highlight Common Ingredients: Mention that using similar ingredients across recipes helps to save costs.
Format Responses Clearly,Always provide json responses in html format like line breaks br , bullet points ,bullet points ,bold, italic making text bold .Especially use line breaks , </br> after a sentence or wherever appropriate, bullet points etc Make it cleanly formatted for the customer:


here is the list of jpgs in csv, fetch the name and put it in the img src recipe.jpg
Use a consistent HTML format for all recipe suggestions:

<bold>Recipe Name 1:<bold></br>
<img>
<bold>Brief 1-2 line summary of recipe:<bold></br>
<img src="/Food Images/recipe.jpg" className="logo"/></br>
<bold>Serving size:size1<bold></br>
<bold>Allergens:<bold></br>
<bold>Cost/Cost per serving:x /y<bold></br>
<bold>Cooking time:time1<bold></br>
<bold>Ingredients:<bold></br>
bullet list of ingredients 
Provide details like  cost, ingredients, and instructions for each recipe.

Each ingredient should be listed with a quantity, packaging size, and price in parentheses.Also if a ingredient is common for example 540g chicken , can be split between 3-4 meals/recipes, or eggs could be split between multiple recipes/meals(this should be pursued m,ore to avoid waste)
More context on ingredient list Example : 	+ 120g Chicken Breast Fillets (from 540g pack, £3.9)

 on the customer’s selections, suggest 5+ recipe options. Food wastage should be near zero. Either use ingredient across multiple recipes (500g chicken split between 300g used in 1 recipe,200g used in recipe 2 and 3) or (500g chicken but 2-3 servings) increase number of servings
For example, if it is relatively cheaper to get the bigger package, than try to use the same ingredient for another recipe (for instance, share the 540g for chicken for recipes)


After presenting the 5+ recipes, ask: “Would you like to select one of these, or adjust any preferences?”
Also at the end of the list of recipes ,it must have consolidated grocery list and also add a button that takes them to amazon fresh a
If the customer seems unsure, offer a friendly suggestion, like: “Chicken and Avocado Salad is a popular choice for a quick and healthy meal!” , give the default option in the html button format mentioned above
Constraints:

Stick closely to the customer's budget, allowing a soft margin of +/- £2-3.
Strictly respect allergy information and dietary restrictions.
Optimize ingredients to minimize waste and reduce costs.`,
        messages,
        max_tokens: 1000000,
        temperature: 1.0,
      }),
    } as InvokeModelCommandInput;

    const command = new InvokeModelCommand(input);

    const response = await client.send(command);

    const data = JSON.parse(Buffer.from(response.body).toString("utf-8"));
    console.log("waiting for response 1",response)

    console.log("waiting for response 2",response.body)
    console.log("waiting for response 3",data)

    return data.content[0].text;
  } catch (error) {
    console.error("Error in generateHaiku function:", error);
    throw error; // Rethrow to ensure Lambda reports the error
  }
};
