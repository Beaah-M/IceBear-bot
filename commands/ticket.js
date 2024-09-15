const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { TICKET_CATEGORY_ID } = process.env;


function createSelectMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId('ticket')
        .setPlaceholder('Selecione')
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('Denúncias')
                .setEmoji('<:alarm:1280890980492378120>')
                .setValue('denuncias'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Sugestão')
                .setEmoji('<:idea:1280890961576071188>')
                .setValue('sugestao'),
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Abra o ticket para os membros'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Você não possui permissão para utilizar este comando.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x07A3F5)
            .setTitle('<:rules:1281948325087678597> `Atenção!`')
            .setDescription('Não abra o ticket se o **assunto** não for de acordo com as categorias abaixo.\n' +
                            '\nSelecione a categoria de **acordo com o assunto.**');

        const select = createSelectMenu();  
        const row = new ActionRowBuilder()
            .addComponents(select);

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });
    },

    async handleSelectMenu(interaction) {
        if (!interaction.isStringSelectMenu()) return;

        const selectedValue = interaction.values[0];
        const user = interaction.user;

        let description = '';
        if (selectedValue === 'denuncias') {
            description = '**`DENÚNCIA:`** \n • Por favor, descreva sua denúncia com o **máximo de detalhes possível**.';
        } else if (selectedValue === 'sugestao') {
            description = '**`SUGESTÃO:`** \n • Estamos ansiosos para ouvir sua sugestão. Por favor, forneça detalhes.';
        }

        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(0x07A3F5)
            .setFooter({ text: 'Beah © 2024' });

        const deleteButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('delete')
                    .setLabel('Fechar')
                    .setEmoji('<:lock:1281947573069938688>')
                    .setStyle('Danger'),
            );

        const guild = interaction.guild;
        const channel = await guild.channels.create({
            name: `${selectedValue}-${user.username}`,
            type: ChannelType.GuildText,
            parent: TICKET_CATEGORY_ID,
            permissionOverwrites: [
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                }
            ],
        });

        await channel.setTopic(`Category: ${selectedValue} | User ID: ${user.id}`);

        await channel.send({ 
            embeds: [embed], 
            components: [deleteButton], 
            content: `||<@${user.id}>||` 
        });

       
        const select = createSelectMenu();  

        const row = new ActionRowBuilder()
            .addComponents(select);

        await interaction.update({
            components: [row],  
        });

        await interaction.followUp({ content: 'Ticket criado com sucesso!', ephemeral: true });
    },

    async handleButton(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'delete') {
            const ticketId = interaction.channel.id;
            const closedByUserId = interaction.user.id;
            const closedByUsername = interaction.user.username;
            const closeDate = new Date().toLocaleString();

            const topic = interaction.channel.topic;
            const categoryMatch = topic ? topic.match(/Category: (\w+)/) : null;
            const category = categoryMatch ? categoryMatch[1] : 'Unknown';

            const adminDeleteMessage = new EmbedBuilder()
                .setTitle('<:arrow:1281961319897239572> Ticket Fechado ') 
                .addFields([
                    {
                        name: '<:id:1281959515167920138> Ticket ID:', 
                        value: ticketId,
                        inline: true
                    },
                    {
                        name: '<:lock:1281947573069938688> Fechado por:', 
                        value: `${closedByUsername} (${closedByUserId})`,
                        inline: true
                    },
                    {
                        name: '<:calendar:1281959535418019851> Data de Fechamento:', 
                        value: closeDate,
                        inline: true
                    },
                    {
                        name: '<:folder:1281959550517379083> Categoria:', 
                        value: category,
                        inline: true
                    }
                ])
                .setColor(0x07A3F5)
                .setFooter({ text: 'Beah © 2024' });

            const adminAlertChannel = interaction.client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
            if (adminAlertChannel) {
                await adminAlertChannel.send({ embeds: [adminDeleteMessage] });
            } else {
                console.error('Admin alert channel not found.');
            }

            await interaction.reply({ content: 'Ticket fechado com sucesso!', ephemeral: true });
            await interaction.channel.delete();
        }
    }
};