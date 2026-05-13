import { GenerateTextResult, OnFinishEvent, OnStepFinishEvent, ToolLoopAgent, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Request, Response } from "express";
import type { Deal } from "@/common/types";
import logger from "./logger";
import { systemPrompt } from "./systemPrompt";
import { getAppConfig } from "./secrets";

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

  const apiConfig = await getAppConfig();
  const openai = createOpenAI({ apiKey: apiConfig.openaiApiKey });

  const agent = new ToolLoopAgent({
    model: openai(apiConfig.openaiModel ?? 'gpt-4o'),
    instructions: systemPrompt,
    tools: {
      webSearch: openai.tools.webSearchPreview({}),
    },
    stopWhen: stepCountIs(10),
    onFinish: async ({ toolCalls, toolResults }: OnFinishEvent) => {
      logger.debug('agent finished', { toolCalls, toolResults});
    },
    prepareStep: async (prepare: unknown) => {
      logger.debug('agent prepare step', { prepare });
    },
    onStepFinish: async ({ toolCalls, toolResults }: OnStepFinishEvent) => {
      logger.debug('agent step finished', { toolCalls, toolResults});
    },
    experimental_onToolCallStart: (toolCall: unknown) => {
      logger.debug('agent tool call started', { toolCall } );
    },
    experimental_onToolCallFinish: (toolCall: unknown) => {
      logger.debug('agent tool call finished', { toolCall } );
    },
  } as any);


  const userPrompt = `Please analyze this ${deal.type} deal:\n${JSON.stringify(deal, null, 2)}`;

  logger.debug("calling agent", {
    userPrompt,
    systemPrompt,
  });

  let result: GenerateTextResult<{}, never>;
  try {
    result = await agent.generate({ prompt: userPrompt });
  } catch (err) {
    logger.error("agent.generate error", { dealId: deal.id, err });
    res.status(500).json({ error: "agent request failed" });
    return;
  }

  if (!result.text) {
    logger.error("agent result error - no text property", { result });
    res.status(500).json({ error: "agent request failed" });
    return;
  }

  logger.debug("agent response", {
    dealId: deal.id,
    result: {
      ...result,
      steps: result.steps.length,
    }
  });

  try {
    const analysis = JSON.parse(result.text);
    res.json(analysis);
    return;
  } catch (err) {
    logger.error("agent parse error", { dealId: deal.id, err: `${err}`, text: result.text });
    // res.status(500).json({ error: "agent request failed" });
  }
  res.json({ markdown: result.text });
}
