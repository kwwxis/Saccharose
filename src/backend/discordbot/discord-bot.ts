import '../loadenv.ts';
import {
  REST,
  Routes,
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  ChatInputCommandInteraction, EmbedBuilder,
} from 'discord.js';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import {
  APIApplicationCommandOptionChoice
} from 'discord-api-types/payloads/v10/_interactions/_applicationCommands/_chatInput/shared';
import { DEFAULT_LANG, LANG_CODES, LangCode } from '../../shared/types/lang-types.ts';
import { AvailableSiteModes, SiteMode } from '../../shared/types/site/site-mode-type.ts';
import { OLResult } from '../../shared/types/ol-types.ts';
import { ol_gen } from '../domain/abstract/basic/OLgen.ts';
import { toBoolean } from '../../shared/util/genericUtil.ts';
import { getGenshinControl } from '../domain/genshin/genshinControl.ts';
import { getZenlessControl } from '../domain/zenless/zenlessControl.ts';
import { getWuwaControl } from '../domain/wuwa/wuwaControl.ts';
import { getStarRailControl } from '../domain/hsr/starRailControl.ts';
import { SbOut } from '../../shared/util/stringUtil.ts';
import { DEFAULT_SEARCH_MODE } from '../../shared/util/searchUtil.ts';

const LANG_CHOICES: APIApplicationCommandOptionChoice<string>[] = LANG_CODES.filter(langCode => langCode !== 'CH')
  .map(langCode => ({
    name: langCode,
    value: langCode,
  }));

try {
  const rest = new REST({ version: '10' })
    .setToken(ENV.DISCORD_BOT_CLIENT_ID);

  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Responds with Pong!')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('sacch')
      .setDescription('Change your Saccharose.wiki user options')
      .addSubcommand(command =>
        command.setName('game')
          .setDescription('Set your game for commands')
          .addStringOption(opt => opt
            .setName('game')
            .setDescription('Game choice')
            .setChoices([
              { name: 'Genshin', value: 'genshin' },
              { name: 'HSR', value: 'hsr' },
              { name: 'Zenless', value: 'zenless' },
              { name: 'Wuwa', value: 'wuwa' },
            ])
            .setRequired(true)),
      )
      .addSubcommand(command =>
        command.setName('inlang')
          .setDescription('Set your input language')
          .addStringOption(opt => opt
            .setName('lang')
            .setDescription('Language choice')
            .setChoices(LANG_CHOICES)
            .setRequired(true)),
      )
      .addSubcommand(command =>
        command.setName('outlang')
          .setDescription('Set your output language')
          .addStringOption(opt => opt
            .setName('lang')
            .setDescription('Language choice')
            .setChoices(LANG_CHOICES)
            .setRequired(true)),
      )
      .addSubcommand(command =>
        command.setName('info')
          .setDescription('Show your current game setting, input language, and output language')
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('ol')
      .setDescription('Generate other languages')
      .addStringOption(option => option
        .setName('text')
        .setDescription('Text')
        .setRequired(true))
      .addBooleanOption(option => option.setName('hideTL').setDescription('Hide TL'))
      .addBooleanOption(option => option.setName('hideRM').setDescription('Hide RM'))
      .addBooleanOption(option => option.setName('addDefaultHidden').setDescription('Add default hidden'))
      .toJSON(),
  ];

  console.log('Started refreshing application (/) commands.');
  await rest.put(Routes.applicationCommands(ENV.DISCORD_BOT_CLIENT_ID), { body: commands });
  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    let commandInfo: ChatInputCommandInteraction = interaction;
    let discordUserId: string = interaction.user.id;
    let siteUser: SiteUser = await SiteUserProvider.find(discordUserId);

    if (!siteUser) {
      await commandInfo.reply('You are not a user of Saccharose.wiki! To become a user, you must login to the site and pass verification.');
      return;
    }

    await handleChatInputCommand(siteUser, commandInfo);
  }
});

async function handleChatInputCommand(user: SiteUser, command: ChatInputCommandInteraction) {
  if (command.commandName === 'ping') {
    await command.reply('Pong!');
  }

  if (command.commandName === 'sacch') {
    const subcommand = command.options.getSubcommand();

    if (subcommand === 'game') {
      const selectedGame: SiteMode = command.options.getString('game') as SiteMode;

      if (!AvailableSiteModes.includes(selectedGame)) {
        await command.reply({
          content: `Not a valid game choice: ` + selectedGame,
          ephemeral: true,
        });
        return;
      }

      await SiteUserProvider.updatePrefs(user.id, prefs => prefs.dbotSiteMode = selectedGame);

      await command.reply({
        content: `Your preferred game has been set to **${selectedGame}**.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'inlang') {
      const langCode: LangCode = command.options.getString('lang') as LangCode;

      if (!LANG_CODES.includes(langCode)) {
        await command.reply({
          content: `Not a valid language code: ` + langCode,
          ephemeral: true,
        });
        return;
      }

      await SiteUserProvider.updatePrefs(user.id, prefs => prefs.inputLangCode = langCode);

      await command.reply({
        content: `Your input language has been set to **${langCode}**.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'outlang') {
      const langCode: LangCode = command.options.getString('lang') as LangCode;

      if (!LANG_CODES.includes(langCode)) {
        await command.reply({
          content: `Not a valid language code: ` + langCode,
          ephemeral: true,
        });
        return;
      }

      await SiteUserProvider.updatePrefs(user.id, prefs => prefs.outputLangCode = langCode);

      await command.reply({
        content: `Your preferred game has been set to **${langCode}**.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'info') {
      const embed = new EmbedBuilder()
        .setTitle('Saccharose.wiki User Info')
        .addFields({
          name: 'Game',
          value: user.prefs.dbotSiteMode || 'unset'
        }, {
          name: 'Input Language',
          value: user.prefs.inputLangCode || DEFAULT_LANG
        }, {
          name: 'Output Language',
          value: user.prefs.outputLangCode || DEFAULT_LANG
        }, {
          name: 'Search Mode',
          value: user.prefs.searchMode || DEFAULT_SEARCH_MODE
        });

      await command.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }

  if (command.commandName === 'ol') {
    if (!user.prefs.dbotSiteMode) {
      await command.reply({
        content: `You must first set which game with \`/sacch game [game]\``,
        ephemeral: true,
      });
      return;
    }

    const text: string = command.options.getString('text') as LangCode;
    const hideTL: boolean = command.options.getBoolean('hideTL') || false;
    const hideRM: boolean = command.options.getBoolean('hideRM') || false;
    const addDefaultHidden: boolean = command.options.getBoolean('addDefaultHidden') || false;

    let results: OLResult[] = await ol_gen(getControl(user), text, {
      hideTl: hideTL,
      hideRm: hideRM,
      addDefaultHidden: addDefaultHidden,
    });

    const embed = new EmbedBuilder()
      .setTitle('Saccharose.wiki OL')
      .setDescription('OL Results for ' + text + (!results.length ? `\n\nNo results found.`: ''));

    for (let result of results) {
      embed.addFields({
        name: 'TextMapHash ' + result.textMapHash,
        value: '```' + result.result + '````'
      });
      if (result.warnings && result.warnings.length) {
        embed.addFields({
          name: 'Warnings',
          value: ' - ' + result.warnings.join('\n - ')
        });
      }
    }

    await command.reply({
      embeds: [embed],
    });
  }
}

function getControl(siteUser: SiteUser) {
  switch (siteUser.prefs.dbotSiteMode) {
    case 'unset':
      return null;
    case 'genshin':
      return getGenshinControl(siteUser);
    case 'hsr':
      return getStarRailControl(siteUser);
    case 'zenless':
      return getZenlessControl(siteUser);
    case 'wuwa':
      return getWuwaControl(siteUser);
  }
}

await client.login(ENV.DISCORD_BOT_CLIENT_SECRET);
