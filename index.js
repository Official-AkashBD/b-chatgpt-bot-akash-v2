const login = require("facebook-chat-api");
const { Configuration, OpenAIApi } = require("openai");
const responses = require("./customResponses");
const config = require("./config");

const email = process.env.FB_EMAIL;
const password = process.env.FB_PASSWORD;
const openaiApiKey = process.env.OPENAI_API_KEY;

const configuration = new Configuration({ apiKey: openaiApiKey });
const openai = new OpenAIApi(configuration);

login({ email, password }, (err, api) => {
  if (err) return console.error(err);
  api.setOptions({ listenEvents: true });

  api.listenMqtt(async (err, event) => {
    if (err) return console.error(err);
    if (event.type !== "message" || !event.body) return;

    const body = event.body.toLowerCase();
    const threadID = event.threadID;

    for (let keyword in responses) {
      if (body.includes(keyword)) {
        return api.sendMessage(responses[keyword], threadID);
      }
    }

    const gptRes = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: event.body }],
    });

    const reply = gptRes.data.choices[0].message.content.trim();
    api.sendMessage(reply, threadID);
  });
});