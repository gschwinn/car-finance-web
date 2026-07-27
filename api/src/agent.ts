import { GenerateTextResult, OnFinishEvent, OnStepFinishEvent, ToolLoopAgent, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import type { Deal } from "@/common/types";
import logger from "./logger";
import { systemPrompt } from "./systemPrompt";
import { getAppConfig } from "./secrets";
import { jsonResponse, parseBody } from "./http";

export async function handleAgentRequest(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const deal = parseBody<Deal>(event);

  if (!deal || typeof deal !== "object" || !("type" in deal)) {
    return jsonResponse(400, { error: "request body must be a valid Deal object" });
  }
  if (deal.type !== "purchase" && deal.type !== "lease") {
    return jsonResponse(400, { error: '"type" must be "purchase" or "lease"' });
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


  const today = new Date().toISOString().split('T')[0];
  const userPrompt = `Today's date is ${today}. Use it in all web searches to ensure results are current.\n\nPlease analyze this ${deal.type} deal:\n${JSON.stringify(deal, null, 2)}`;

  logger.debug("calling agent", {
    userPrompt,
    systemPrompt,
  });

  let result: GenerateTextResult<{}, never>;
  try {
    result = await agent.generate({ prompt: userPrompt });
  } catch (err) {
    logger.error("agent.generate error", { dealId: deal.id, err });
    return jsonResponse(500, { error: "agent request failed" });
  }

  if (!result.text) {
    logger.error("agent result error - no text property", { result });
    return jsonResponse(500, { error: "agent request failed" });
  }

  logger.debug("agent response", {
    dealId: deal.id,
    result: {
      ...result,
      steps: result.steps.length,
    }
  });

  // Strip markdown code fences the model sometimes adds despite instructions
  const cleaned = result.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const analysis = JSON.parse(cleaned);
    return jsonResponse(200, analysis);
  } catch (err) {
    logger.error("agent parse error", { dealId: deal.id, err: `${err}`, text: result.text });
    return jsonResponse(500, { error: "agent request failed" });
  }
}
