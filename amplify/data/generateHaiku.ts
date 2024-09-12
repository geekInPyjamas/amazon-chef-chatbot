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
    chatHistory.forEach((entry: { user: string; bot?: string }) => {
      const currentRole = lastRole === "user" ? "assistant" : "user";

      // Ensure role alternation and add messages
      if (entry.user) {
        messages.push({
          role: currentRole,
          content: [{ type: "text", text: entry.user }]
        });
      }

      // Toggle role for next entry
      lastRole = currentRole;

      if (entry.bot) {
        messages.push({
          role: currentRole === "user" ? "assistant" : "user",
          content: [{ type: "text", text: entry.bot }]
        });
        lastRole = currentRole === "user" ? "assistant" : "user";
      }
    });

    // Add the current prompt as a user message
    messages.push({
      role: "user",
      content: [{ type: "text", text: prompt }]
    });

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

Collect User Preferences( not exactly these numbers but in the format):
Ask  all Questions with Suggested Options and always one after the other only
Also for multiple options and for following options, render a HTML button for each option in this format only '<button data-action='option name'>option name</button>'
Always Provide predefined options for each question to help guide the customer’s choices. For example:
Budget: "What is your budget per meal? Low (£1-£2), Medium (£3-£5), or High (£7+) or a weekly budget of 30 pounds , 40 or more?"
Allergies: "Do you have any of the following allergies: Dairy, Nuts, Gluten, Other,None?"
Number of People: "How many people are you cooking for? 1, 2, 3, or more?"
How many meals do you expect ? 1,2,3,4, or more
Meal Type: "Are you looking for Breakfast, Lunch, Dinner, or Snacks or mix of all?"
Meal prep time : instant , quick and easy(15mins or less) or 15 min meal prep or mix of all? 
Allow Multiple Selections: Inform the customer they can select multiple options when applicable.
Ask Follow-up Questions: After receiving an answer, ask, “Would you like to adjust any other preferences?” before moving to the next step.
Suggest 5+ Recipes and at the end consolidated grocery list:

Provide details like serving size, cooking time, cost, ingredients, and instructions for each recipe.
Highlight Common Ingredients: Mention that using similar ingredients across recipes helps to save costs.
Format Responses Clearly,Always provide json responses in html format like line breaks br , bullet points ,bullet points ,bold, italic making text bold .Especially use line breaks , </br> after a sentence or wherever appropriate, bullet points etc Make it cleanly formatted for the customer:


BasedFor example, if it is relatively cheaper to get the bigger package, than try to use the same ingredient for another recipe (for instance, share the 540g for chicken for recipes)






 on the customer’s selections, suggest 5+ recipe options. Food wastage should be near zero. Either use ingredient across multiple recipes (500g chicken split between 300g used in 1 recipe,200g used in recipe 2 and 3) or (500g chicken but 2-3 servings) increase number of servings
For example, if it is relatively cheaper to get the bigger package, than try to use the same ingredient for another recipe (for instance, share the 540g for chicken for recipes)







Use a consistent HTML format for recipe suggestions:
Recipe Name in Bold <br>
Recipe summary in 2 lines <br>
Serving Size: Indicate the number of servings (e.g., "1 serving or 2 servings").<br>
Ingredients List: Each ingredient should be listed with a quantity, packaging size, and price in parentheses.Also if a ingredient is common for example 540g chicken , can be split between 3-4 meals/recipes, or eggs could be split between multiple recipes/meals(this should be pursued m,ore to avoid waste)
More context on ingredient list Example : 	+ 120g Chicken Breast Fillets (from 540g pack, £3.9)
<br>Cost: Calculate and display the total estimated cost.<br>
Provide an Optimized Shopping List after listing the recipes.<br>
Format responses in HTML Always provide json responses in html format like line breaks br , bullet points to ensure clarity (use bold, bullet points, and line breaks appropriately).
Encourage Engagement:

After presenting the recipes, ask: “Would you like to select one of these, or adjust any preferences?”
If the customer seems unsure, offer a friendly suggestion, like: “Chicken and Avocado Salad is a popular choice for a quick and healthy meal!”
Constraints:

Stick closely to the customer's budget, allowing a soft margin of +/- £2-3.
Strictly respect allergy information and dietary restrictions.
Optimize ingredients to minimize waste and reduce costs.

At the end of the recipes , give  a consolidated grocery list for all the recipes 

Cheerios, Cereal, Kids cereal, -, 365, 4.5, -, 400g, 150 kcal, Freezer storable: No, Protein: 0g, Organic: No, Allergens: None
Kellogg's Granola, Cereal, Low sugar granola cereal, -, 365, 3.22, -, 350g, 190 kcal, Freezer storable: No, Protein: 0g, Organic: No, Allergens: None
Avocado (2 pack), Fresh Produce, Avocado (2 pack), 2, 3, 1.6, -, -, 198 kcal, Freezer storable: No, Protein: 1.9g, Organic: No, Allergens: None
Avocado, Fresh Produce, Avocado, 1, 3, 0.75, -, -, 198 kcal, Freezer storable: No, Protein: 1.9g, Organic: No, Allergens: None
Aubergine, Fresh Produce, Aubergine, 1, 5, 0.9, -, -, 21 kcal, Freezer storable: No, Protein: 0.9g, Organic: No, Allergens: None
Courgette (3 pack), Fresh Produce, Courgette (3 pack), 3, 5, 1.45, -, -, 18 kcal, Freezer storable: No, Protein: 1.3g, Organic: No, Allergens: None
Spinach (220g), Fresh Produce, Baby Spinach, -, 6, 1.35, -, 220g, 19 kcal, Freezer storable: No, Protein: 2.6g, Organic: No, Allergens: None
Broccoli, Fresh Produce, Broccoli, 1, 5, 0.76, -, 350g, 35 kcal, Freezer storable: No, Protein: 3.3g, Organic: No, Allergens: None
Cucumber, Fresh Produce, Cucumber, 1, 4, 0.89, -, -, 16 kcal, Freezer storable: No, Protein: 1g, Organic: No, Allergens: None
Mixed Peppers (3 pack), Fresh Produce, Mixed peppers, 3, 7, 1.75, -, -, 24 kcal, Freezer storable: No, Protein: 0.8g, Organic: No, Allergens: None
Cherry Tomatoes (320g), Fresh Produce, Cherry Tomatoes, -, 7, 1.1, -, 320g, 26 kcal, Freezer storable: No, Protein: 1.1g, Organic: No, Allergens: None
Tomatoes (320g), Fresh Produce, Baby Plum Tomatoes, -, 7, 1.1, -, 320g, 26 kcal, Freezer storable: No, Protein: 1.1g, Organic: No, Allergens: None
Organic Baby Plum, Fresh Produce, Organic Baby Plum, -, 7, 2.78, -, 225g, 26 kcal, Freezer storable: No, Protein: 1.1g, Organic: Yes, Allergens: None
Carrots (500g), Fresh Produce, Carrots, -, 8, 0.5, -, 500g, 44 kcal, Freezer storable: No, Protein: 0.5g, Organic: No, Allergens: None
Onions (3 pack), Fresh Produce, Brown Onions, 3, 20, 1, -, -, 51 kcal, Freezer storable: No, Protein: 1g, Organic: No, Allergens: None
Spinach, Freezer, Whole leaf Spinach, -, 180, 2, -, 1200g, 26 kcal, Freezer storable: Yes, Protein: 3.1g, Organic: No, Allergens: None
Spinach, Freezer, Organic Chopped Spinach, -, 180, 2.9, -, 450g, 26 kcal, Freezer storable: Yes, Protein: 3.1g, Organic: Yes, Allergens: None
Courgette (2 pack), Fresh Produce, Organic Courgette (2 pack), 2, -, 2.4, -, -, 20 kcal, Freezer storable: No, Protein: 1.8g, Organic: Yes, Allergens: None
Carrots (1kg), Fresh Produce, Carrots (1kg), -, 8, 0.7, -, 1000g, 44 kcal, Freezer storable: No, Protein: 0.5g, Organic: No, Allergens: None
Chicken, Meat, British Skinless Chicken Breast Fillets, -, 4, 6.6, -, 1000g, 157 kcal, Freezer storable: Yes, Protein: 31.9g, Organic: No, Allergens: None
Chicken, Meat, British Large Whole Chicken (1.6kg), -, 4, 4.9, -, 1600g, 184 kcal, Freezer storable: Yes, Protein: 30.5g, Organic: No, Allergens: None
Chicken, Meat, British Fresh Chicken Thighs (1kg), -, 4, 3.2, -, 1000g, 134 kcal, Freezer storable: Yes, Protein: 28.1g, Organic: No, Allergens: None
Chicken, Meat, British Chicken Breast Fillets (540g), -, 4, 3.9, -, 540g, 151 kcal, Freezer storable: Yes, Protein: 29.6g, Organic: No, Allergens: None
Chicken, Meat, Market Street British Chicken Thigh Fillets (600g), -, 4, 4.5, -, 600g, 144 kcal, Freezer storable: Yes, Protein: 30g, Organic: No, Allergens: None
Chicken, Meat, British Diced Chicken Breast (400g), -, 4, 3.4, -, 400g, 112 kcal, Freezer storable: Yes, Protein: 22.4g, Organic: No, Allergens: None
Chicken, Meat, Chicken Thigh Fillets (1kg), -, 4, 6.2, -, 1000g, 144 kcal, Freezer storable: Yes, Protein: 30g, Organic: No, Allergens: None
Chicken, Meat, Chicken Breast Fillet (630g), -, 4, 5, -, 630g, 151 kcal, Freezer storable: Yes, Protein: 29.6g, Organic: No, Allergens: None
Chicken, Meat, British Chicken Breast Fillets (300g), -, 4, 2.55, -, 300g, 151 kcal, Freezer storable: Yes, Protein: 29.6g, Organic: No, Allergens: None
Beef Mince, Meat, 5% Fat British Beef Mince (500g), -, 5, 3.49, -, 500g, 149 kcal, Freezer storable: Yes, Protein: 26.2g, Organic: No, Allergens: None
Beef Mince, Meat, 5% Fat British Beef Mince (750g), -, 5, 5, -, 750g, 149 kcal, Freezer storable: Yes, Protein: 26.2g, Organic: No, Allergens: None
Beef Mince, Meat, 20% Fat British Beef Mince (500g), -, 5, 2.65, -, 500g, 274 kcal, Freezer storable: Yes, Protein: 24.3g, Organic: No, Allergens: None
Beef Mince, Meat, 12% Fat British Beef Mince (500g), -, 5, 4.1, -, 500g, 210 kcal, Freezer storable: Yes, Protein: 25.8g, Organic: No, Allergens: None
Beef Mince, Meat, 5% Fat British Beef Mince (250g), -, 5, 2.2, -, 250g, 149 kcal, Freezer storable: Yes, Protein: 26.2g, Organic: No, Allergens: None
Beef Mince, Meat, 12% Fat British Beef Mince (750g), -, 5, 4.9, -, 750g, 210 kcal, Freezer storable: Yes, Protein: 25.8g, Organic: No, Allergens: None
Beef Mince, Meat, 12% Organic Fat British Beef Mince (500g), -, 5, 5.25, -, 500g, 183 kcal, Freezer storable: Yes, Protein: 20g, Organic: Yes, Allergens: None
**Broccoli, Fresh Produce, Organic Broccoli (300g), 1, 5, 1.16, -,
        `,
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
