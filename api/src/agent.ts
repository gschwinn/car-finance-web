import { ToolLoopAgent, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Request, Response } from "express";
import type { Deal } from "@/common/types";
import logger from "./logger";
import { systemPrompt } from "./systemPrompt";
import { getApiConfig } from "./secrets";

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

  const apiConfig = await getApiConfig();
  const openai = createOpenAI({ apiKey: apiConfig.openaiApiKey });

  const agent = new ToolLoopAgent({
    model: openai(apiConfig.openaiModel),
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
      logger.debug('agent step finished');
    },
    experimental_onToolCallStart: (toolCall: unknown) => {
      logger.debug('agent tool call started', { toolCall } );
    },
    experimental_onToolCallFinish: (toolCall: unknown) => {
      logger.debug('agent tool call finished', { toolCall } );
    },
  } as any);

  try {
    const result = await agent.generate({
      prompt: `Please analyze this ${deal.type} deal:\n${JSON.stringify(deal, null, 2)}`,
    });

    logger.debug("agent response", {
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
