import {
  ArgumentType,
  Cli,
  CliCommandBuilder,
  HandlerArgs,
  ICommandArgument,
  validateFunctions,
} from 'https://deno.land/x/matey/mod.ts';

import { shelly } from 'https://deno.land/x/shelly/mod.ts';

import Tuner from 'https://deno.land/x/tuner@v0.1.0/mod.ts';

async function generateCommit(
  changes: string,
  maxTokens: number,
): Promise<string> {
  const apiKey = Tuner.getEnv('OPENAI_API_KEY');
  const prompt =
    `Construct a commit message based on the following changes:\n\n${changes}\n\n
    Use this convention: fix: a commit of type "fix" fixes a bug in your code (corresponds to PATCH in Semantic Versioning).
    feat: a commit of type "feat" adds a new feature to your code (corresponds to MINOR in Semantic Versioning).
    BREAKING CHANGE: a commit that has a "BREAKING CHANGE" footer or a commit that ends with an exclamation mark (!) after the type or scope introduces changes that break backwards compatibility (corresponds to MAJOR in Semantic Versioning). A BREAKING CHANGE may be part of any commit type.
    Other commit types are allowed. For example, @commitlint/config-conventional (based on the Angular convention) recommends build, chore, ci, docs, style, refactor, perf, test, and others.
    Other commit footers may follow the git trailer format convention.
    Response me only commit commit message without detailed description:`
      .slice(0, 4096);
  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        'model': 'gpt-3.5-turbo',
        'messages': [{
          'role': 'user',
          'content': prompt,
        }],
        'max_tokens': maxTokens,
      }),
    },
  );
  const data = await response.json();
  console.log(data);
  return data.choices[0].message.content;
}

const tokenArgument: ICommandArgument = {
  name: '--maxTokens',
  description: 'Maximum number of tokens to generate',
  type: ArgumentType.OPTION,
  valueValidator: validateFunctions.numberValidate,
  optionNameRequired: true,
  required: false,
};

const shortArgument: ICommandArgument = {
  name: '--short',
  description: 'Generate short commit message',
  type: ArgumentType.FLAG,
  required: false,
};

const generateHandler = async (args: HandlerArgs) => {
  let {
    '--maxTokens': maxTokens,
    '--short': short,
  } = args;
  const diff = await (await shelly('git diff')).stdout;
  maxTokens = short ? '20' : maxTokens || '50';
  const commitMessage = await generateCommit(
    diff,
    parseInt(maxTokens as string, 10)!,
  );
  console.log(commitMessage);
};

export const generate = new CliCommandBuilder()
  .setName('generate')
  .setDescription('Generate commit message based on git diff')
  .addArgument(tokenArgument)
  .addArgument(shortArgument)
  .setHandler(generateHandler).build();

const cli = new Cli().addCommand(generate);

console.log(Deno.args);
await cli.execute(Deno.args);
