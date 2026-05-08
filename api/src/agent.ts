import { ToolLoopAgent, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Request, Response } from "express";
import type { Deal } from "@/common/types.js";
import logger from "./logger.js";
import { systemPrompt } from "./systemPrompt.js";

export async function handleAgentRequest(req: Request, res: Response) {
  const deal = req.body as Deal;

  if (!deal || typeof deal !== "object" || !("type" in deal)) {
    res.status(400).json({ error: "request body must be a valid Deal object" });
    return;
  }
  if (deal.type !== "purchase" && deal.type !== "lease") {
    res.status(400).json({ error: '"type" must be "purchase" or "lease"' });
    return;
  }

  const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error("OPENAI_APIKEY environment variable is required");
    res.status(500).json({ error: "agent request failed" });
    return;
  }

  const openai = createOpenAI({ apiKey });

  const agent = new ToolLoopAgent({
    model: openai(MODEL),
    instructions: systemPrompt,
    tools: {
      webSearch: openai.tools.webSearchPreview({}),
    },
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      logger.debug('agent finished');
    },
    prepareStep: async (prepare: unknown) => {
      logger.debug('agent prepare step', { prepare });
    },
    onStepFinish: async (step: unknown) => {
      logger.debug('agent step finished', { step });
    },
  });

  try {
    const result = await agent.generate({
      prompt: `Please analyze this ${deal.type} deal:\n${JSON.stringify(deal, null, 2)}`,
    });

    logger.info("agent response", {
      dealId: deal.id,
      steps: result.steps.length,
      usage: result.usage,
    });
    const analysis = JSON.parse(result.text);
    res.json(analysis);
  } catch (err) {
    logger.error("agent error", { dealId: deal.id, err });
    res.status(500).json({ error: "agent request failed" });
  }
}
