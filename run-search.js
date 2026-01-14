const { GoogleGenerativeAI, DynamicRetrievalMode } = require("@google/generative-ai");
require('dotenv').config();

const fetch = require('cross-fetch');
if (!global.fetch) {
  global.fetch = fetch;
  global.Headers = fetch.Headers;
  global.Request = fetch.Request;
  global.Response = fetch.Response;
}

async function runSearchTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is missing in .env file.");
    console.error("   Please create a .env file based on .env.example and add your API key.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [
      {
        googleSearch: {},
      },
    ],
  });

  const prompt = "Get a lyrics of a song name 'Fujii kaze - Hana'";
  console.log(`\n🔎 Sending prompt: "${prompt}"...\n`);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const groundingMetadata = response.candidates[0].groundingMetadata;

    console.log("---------------- RESPONSE ----------------");
    console.log(text);
    console.log("------------------------------------------\n");

    if (groundingMetadata && groundingMetadata.groundingChunks) {
      console.log("📚 Grounding (Search Sources):");
      groundingMetadata.groundingChunks.forEach((chunk, index) => {
        if (chunk.web) {
          console.log(`   [${index + 1}] ${chunk.web.title}`);
          console.log(`       URL: ${chunk.web.uri}`);
        }
      });
      
      if (groundingMetadata.searchEntryPoint) {
         console.log(`\n🔗 Google Search Result: ${groundingMetadata.searchEntryPoint.renderedContent}`);
      }
    } else {
      console.log("ℹ️  No search grounding performed for this query (threshold not met or model knew the answer).");
    }

  } catch (error) {
    console.error("❌ Error generating content:", error.message);
  }
}

runSearchTest();
