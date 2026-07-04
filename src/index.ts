#!/usr/bin/env node
import { Command } from "commander";
import { registerCloseoutCommand } from "./cli/commands/closeout";
import { registerCompileCommand } from "./cli/commands/compile";
import { registerConceptCommand } from "./cli/commands/concept";
import { registerDecisionCommand } from "./cli/commands/decision";
import { registerEventCommand } from "./cli/commands/event";
import { registerInitCommand } from "./cli/commands/init";
import { registerInstallAgentCommand } from "./cli/commands/installAgent";
import { registerLinkCommand } from "./cli/commands/link";
import { registerNoteCommand } from "./cli/commands/note";
import { registerRecordCommand } from "./cli/commands/record";
import { registerRenderCommand } from "./cli/commands/render";
import { registerSearchCommand } from "./cli/commands/search";
import { registerSetupCommand } from "./cli/commands/setup";
import { registerSiteCommand } from "./cli/commands/site";
import { registerSpinCommand } from "./cli/commands/spin";
import { registerStatusCommand } from "./cli/commands/status";
import { registerSymbolCommand } from "./cli/commands/symbol";
import { registerValidateCommand } from "./cli/commands/validate";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("wk")
    .description("Wikiwiki is an agent-native living documentation system for code repos.")
    .version("1.0.0");

  registerInitCommand(program);
  registerSetupCommand(program);
  registerCloseoutCommand(program);
  registerInstallAgentCommand(program);
  registerStatusCommand(program);
  registerNoteCommand(program);
  registerConceptCommand(program);
  registerDecisionCommand(program);
  registerEventCommand(program);
  registerLinkCommand(program);
  registerSymbolCommand(program);
  registerRecordCommand(program);
  registerSearchCommand(program);
  registerSpinCommand(program);
  registerCompileCommand(program);
  registerSiteCommand(program);
  registerValidateCommand(program);
  registerRenderCommand(program);

  return program;
}

createProgram().parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
