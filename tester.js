const { Client, Intents, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');

const token = "";  // Nhập token của bạn ở đây
const clientId = "708910694082543738";
const botstatus = "Kurumi Bypass V2";
const madeby = "Hoàng Long Calisthenic";
const endpoint = "http://45.90.13.151:6041";
const robloxApiUrl = "https://users.roblox.com/v1/usernames/users";

const client = new Client({ intents: 3276799 });
const rest = new REST({ version: '9' }).setToken(token);

const commands = [
    {
        name: 'delta',
        description: 'Bypass Links or Roblox Username',
    },
];

client.once('ready', async () => {
    console.log(`\x1b[36mSuccessfully Logged In As ${client.user.username}\x1b[0m`);

    try {
        console.log('Started refreshing global application (/) commands.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    client.user.setPresence({
        activities: [{ name: botstatus }],
        status: 'dnd',
    });
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand() && interaction.commandName === 'delta') {
        const modal = new ModalBuilder()
            .setCustomId('deltaModal')
            .setTitle('Nhập Liên Kết hoặc Tên Người Dùng Roblox');

        const input = new TextInputBuilder()
            .setCustomId('deltaInput')
            .setLabel('Nhập Username Hoặc Link Delta')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(input);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'deltaModal') {
        await delta(interaction);
    }
});

async function getRobloxUserId(username) {
    const url = robloxApiUrl;
    const payload = { usernames: [username] };
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        const response = await axios.post(url, payload, { headers });
        const data = response.data;

        if (data.data && data.data.length > 0) {
            return data.data[0].id;
        } else {
            return null;
        }
    } catch (error) {
        console.error(`HTTP Request failed: ${error}`);
        return null;
    }
}

async function handlePlatoBoost(link) {
    if (!link.startsWith("https://gateway.platoboost.com/a/")) {
        return { status: "fail", link, message: "Không hỗ trợ loại bypass này." };
    }

    const apiUrl = `${endpoint}/?url=${link}`;

    try {
        const response = await axios.get(apiUrl);
        const json = response.data;

        if (json.status === "success") {
            return { status: "success", link, key: json.key, time: json.time };
        } else if (json.status === "fail" && json.message === "Liên Kết Không Tồn Tại.") {
            return { status: "fail", link, message: "Liên Kết Không Tồn Tại." };
        } else {
            return { status: "error", link, message: "ERROR" };
        }
    } catch (error) {
        console.error(error);
        return { status: "error", link, message: "ERROR" };
    }
}

async function delta(interaction) {
    const input = interaction.fields.getTextInputValue('deltaInput');
    const lines = input.split('\n');
    let successResults = [];
    let failResults = [];

    await interaction.reply({
        embeds: [new EmbedBuilder()
            .setTitle("Bypassing...")
            .setColor('#1E90FF')  // Màu xanh dương
            .setDescription('```Đang Bypass Quá Trình Này Có Thể Mất Vài Giây...```')
            .setFooter({ text: `Requested By ${interaction.user.username} | Made by ${madeby} | Powered By ${madeby}` })
            .setTimestamp()
        ],
    });

    for (const line of lines) {
        const trimmedLine = line.trim();
        let result;

        if (trimmedLine.startsWith("https://gateway.platoboost.com/a/")) {
            result = await handlePlatoBoost(trimmedLine);
        } else {
            const robloxUserId = await getRobloxUserId(trimmedLine);

            if (robloxUserId) {
                const bypassLink = `https://gateway.platoboost.com/a/8?id=${robloxUserId}`;
                result = await handlePlatoBoost(bypassLink);
            } else {
                result = { status: "fail", link: trimmedLine, message: "Không Tìm Thấy Tên Người Dùng Roblox." };
            }
        }

        if (result.status === "success") {
            successResults.push({ link: trimmedLine, key: result.key, time: result.time });
        } else {
            failResults.push({ link: trimmedLine, message: result.message });
        }
    }

    // Tạo embed cho các kết quả thành công
    const embedSuccess = new EmbedBuilder()
        .setTitle("Kurumi Bypass - Thành Công")
        .setColor('#00FF00')  // Màu xanh lá cây
        .setFooter({ text: `Requested By ${interaction.user.username} | Made by ${madeby} | Powered By ${madeby}` })
        .setTimestamp();

    for (const result of successResults) {
        embedSuccess.addFields(
            { name: 'Link hoặc Username', value: result.link },
            { name: 'Key', value: result.key },
            { name: 'Thời gian', value: result.time }
        );
    }

    // Tạo embed cho các kết quả thất bại
    const embedFail = new EmbedBuilder()
        .setTitle("Kurumi Bypass - Thất Bại")
        .setColor('#FF0000')  // Màu đỏ
        .setFooter({ text: `Requested By ${interaction.user.username} | Made by ${madeby} | Powered By ${madeby}` })
        .setTimestamp();

    for (const result of failResults) {
        embedFail.addFields(
            { name: result.link, value: result.message }
        );
    }

    // Gửi thông báo thành công và thất bại
    if (successResults.length > 0) {
        await interaction.followUp({ embeds: [embedSuccess] });
    }

    if (failResults.length > 0) {
        await interaction.followUp({ embeds: [embedFail] });
    }
}

client.login(token);
