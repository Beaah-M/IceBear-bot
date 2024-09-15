const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('formulario')
        .setDescription('Abra o painel do formulário para os membros.')
        .addChannelOption(option => 
            option.setName('canal_formulario')
                .setDescription('Canal para enviar o formulário para os membros.')
                .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('canal_logs')
                .setDescription('Canal para enviar as logs dos formulários recebidos.')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ content: 'Você não possui permissão para utilizar este comando.', ephemeral: true });
            return;
        }

        const canalFormulario = interaction.options.getChannel('canal_formulario');
        const canalLogs = interaction.options.getChannel('canal_logs');
      
        if (!canalFormulario || canalFormulario.type !== ChannelType.GuildText) {
            await interaction.reply({ content: `O canal ${canalFormulario} não é um canal de texto.`, ephemeral: true });
            return;
        }

        if (!canalLogs || canalLogs.type !== ChannelType.GuildText) {
            await interaction.reply({ content: `O canal ${canalLogs} não é um canal de texto.`, ephemeral: true });
            return;
        }

        await db.set(`canal_formulario_${interaction.guild.id}`, canalFormulario.id);
        await db.set(`canal_logs_${interaction.guild.id}`, canalLogs.id);

        const embed = new EmbedBuilder()
            .setTitle('Canais Configurados!')
            .setDescription(`> Canal do Formulário: ${canalFormulario}.\n> Canal de Logs: ${canalLogs}.`);

        await interaction.reply({ embeds: [embed], ephemeral: true });

        const embedFormulario = new EmbedBuilder()
            .setColor(0x07A3F5)
            .setAuthor ({
                name: interaction.guild.name,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTitle('**Formulário**')
            .setDescription('Faça seu registro clicando no botão abaixo!');

        const botao = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('formulario')
                .setEmoji('<:form:1280888341537095700>')
                .setLabel('Abrir Registro')
                .setStyle(ButtonStyle.Primary)
        );

        await canalFormulario.send({ embeds: [embedFormulario], components: [botao] });
    },

    createModal() {
        const modal = new ModalBuilder()
            .setCustomId('formularioModal')
            .setTitle('Formulário de Recrutamento');

        const nomeInput = new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome')
            .setPlaceholder('Nome do personagem')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(8);

        const idInput = new TextInputBuilder()
            .setCustomId('id')
            .setLabel('ID')
            .setPlaceholder('ID da cidade')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(6);

        const tellInput = new TextInputBuilder()
            .setCustomId('tell')
            .setLabel('Telefone')
            .setPlaceholder('Telefone da cidade. Formato (000-000)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(7)
            .setMaxLength(7);

        const recInput = new TextInputBuilder()
            .setCustomId('rec')
            .setLabel ('Recrutador(a)')
            .setPlaceholder('Nome do recrutador(a)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(8)

        const modalActionRow1 = new ActionRowBuilder().addComponents(nomeInput);
        const modalActionRow2 = new ActionRowBuilder().addComponents(idInput);
        const modalActionRow3 = new ActionRowBuilder().addComponents(tellInput);
        const modalActionRow4 = new ActionRowBuilder().addComponents(recInput);

        modal.addComponents(modalActionRow1, modalActionRow2, modalActionRow3, modalActionRow4);
        return modal;
    },

    async processModal(interaction) {
        const nome = interaction.fields.getTextInputValue('nome');
        const id = interaction.fields.getTextInputValue('id');
        const tell = interaction.fields.getTextInputValue('tell');
        const rec = interaction.fields.getTextInputValue('rec');

        const nomeRegex = /^[A-Za-z]{3,10}$/;
        const idRegex = /^[0-9]{1,6}$/;
        const tellRegex= /^[0-9-]{7}$/;
        const recRegex = /^[A-Za-z]{3,10}$/;

        if (!nomeRegex.test(nome)) {
            return interaction.reply({ content: 'O nome deve conter apenas letras e ter entre 2 a 8 caracteres.', ephemeral: true });
        }

        if (!idRegex.test(id)) {
            return interaction.reply({ content: 'O ID deve conter apenas números e ter entre 1 a 6 caracteres.', ephemeral: true });
        }

        if (!tellRegex.test(tell)) {
            return interaction.reply({ content: 'O telefone deve conter apenas números e ter 7 dígitos.', ephemeral: true });
        }

        if (!recRegex.test(rec)) {
            return interaction.reply({ content: 'O recrutador(a) deve conter apenas letras e ter entre 2 a 8 caracteres.', ephemeral: true });
        }

        const canalLogsId = await db.get(`canal_logs_${interaction.guild.id}`);
        const canalLogs = interaction.guild.channels.cache.get(canalLogsId);

        if (canalLogs) {
            const logEmbed = new EmbedBuilder()
                .setTitle('<:form:1280888341537095700> Novo Registro Recebido')
                .setColor(0x000000)
                .setDescription(
                    `**Nome:** ${nome}\n` + 
                    `**ID:** ${id}\n` +
                    `**Tel:** ${tell}\n` +
                    `**Recrutador:** ${rec}`
                )
                .setTimestamp();

            canalLogs.send({ embeds: [logEmbed] });
        }

        await interaction.reply({ content: 'Formulário enviado com sucesso!', ephemeral: true });
    }
};
