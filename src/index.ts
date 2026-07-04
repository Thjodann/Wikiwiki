#!/usr/bin/env node
import { Command } from "commander";
import { registerConceptCommand } from "./cli/commands/concept";
import { registerDecisionCommand } from "./cli/commands/decision";
import { registerEventCommand } from "./cli/commands/event";
import { registerInitCommand } from "./cli/commands/init";
import { registerLinkCommand } from "./cli/commands/link";
import { registerNoteCommand } from "./cli/commands/note";
import { registerRenderCommand } from "./cli/commands/render";
import { registerSpinCommand } from "./cli/commands/spin";
import { registerStatusCommand } from "./cli/commands/status";
import { registerValidateCommand } from "./cli/commands/validate";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("wikiwiki")
    .description("Agent-native living documentation for code repos.")
    .version("0.1.0");

  registerInitCommand(program);
  registerStatusCommand(program);
  registerNoteCommand(program);
  registerConceptCommand(program);
  registerDecisionCommand(program);
  registerEventCommand(program);
  registerLinkCommand(program);
  registerSpinCommand(program);
  registerValidateCommand(program);
  registerRenderCommand(program);

  return program;
}

createProgram().parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
