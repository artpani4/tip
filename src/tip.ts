import {
  ArgumentType,
  Cli,
  CliCommandBuilder,
  HandlerArgs,
  ICommandArgument,
  validateFunctions,
} from 'https://deno.land/x/matey@v0.1.1/mod.ts';

import { shelly } from 'https://deno.land/x/shelly/mod.ts';

import Tuner from 'https://deno.land/x/tuner@v0.1.0/mod.ts';

async function generateCommit(
  changes: string,
  maxTokens: number,
  addInfo?: string,
): Promise<string> {
  const apiKey = Tuner.getEnv('OPENAI_API_KEY');
  const prompt =
    `Construct a commit message based on the following changes.
    ${addInfo ? 'Important: ' + addInfo : ''}
    Response me only  commit message.
    Changes: ${changes}`
      .slice(0, 16300);

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

const addInfoArgument: ICommandArgument = {
  name: '--info',
  description: 'Addition info',
  type: ArgumentType.OPTION,
  optionNameRequired: true,
  required: false,
};

const generateHandler = async (args: HandlerArgs) => {
  let {
    '--maxTokens': maxTokens,
    '--short': short,
    '--info': addInfo,
  } = args;
  const diff = await (await shelly('git diff')).stdout;
  maxTokens = short ? '20' : maxTokens || '100';
  const commitMessage = await generateCommit(
    diff,
    parseInt(maxTokens as string, 10)!,
    addInfo as string,
  );
  console.log(commitMessage);
};

export const generate = new CliCommandBuilder()
  .setName('generate')
  .setDescription('Generate commit message based on git diff')
  .addArgument(tokenArgument)
  .addArgument(shortArgument)
  .addArgument(addInfoArgument)
  .setHandler(generateHandler).build();

const cli = new Cli().addCommand(generate);

await cli.execute(Deno.args.join(' '));
