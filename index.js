const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const { TOKEN } = process.env;
const fs = require('fs');
const path = require('path');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`Esse comando em ${filePath} está com "data" ou "execute" ausente`);
        }
    }
} else {
    console.error(`Diretório ${commandsPath} não encontrado!`);
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Pronto! Login realizado como ${readyClient.user.tag}`);
    readyClient.user.setStatus('online');
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error('Comando não encontrado');
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply('Houve um erro ao executar o comando!');
        }
    } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
        const command = interaction.client.commands.get('ticket');
        if (command) {
            try {
                if (interaction.isStringSelectMenu()) {
                    await command.handleSelectMenu(interaction);
                } else if (interaction.isButton()) {
                    await command.handleButton(interaction);
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Ocorreu um erro ao processar a interação!', ephemeral: true });
            }
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId === 'formulario') {
            const formulario = require('./commands/formulario');
            const modal = formulario.createModal(interaction)
            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'formularioModal') {
            const formulario = require('./commands/formulario');
            await formulario.processModal(interaction);
        }
    }
});

client.login(TOKEN);
