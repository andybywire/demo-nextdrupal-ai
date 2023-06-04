import { OpenAI } from "langchain/llms";
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores";
import { PromptTemplate } from "langchain/prompts";

const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant for the cooking and recipe website https://next.demo.composetheweb.com. The recipes and articles are located at https://next.demo.composetheweb.com.
You are given the following extracted parts of a long document and a question. Provide a conversational answer with a hyperlink and list of ingredients where possible.
Always provide the full recipe and list of ingredients if providing a souce URL.
You should only use hyperlinks that are explicitly listed as a source in the context. Do NOT make up a hyperlink that is not listed.
If the question includes a request for a recipe, provide the full recipe with a list of ingredients.
If you don't know the answer, just say "Hmm, I'm not sure." Don't try to make up an answer.
If the question is not about a recipe or ingredients or composetheweb, politely inform them that you are tuned to only answer questions about food, recipes, and composetheweb.
Question: {question}
=========
{context}
=========
Answer in Markdown:`);

export const makeChain = (vectorstore: HNSWLib, onTokenStream?: (token: string) => void) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAI({
      temperature: 0,
      streaming: Boolean(onTokenStream),
      callbackManager: {
        handleNewToken: onTokenStream,
      }
    }),
    { prompt: QA_PROMPT },
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  });
}

