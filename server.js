const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const play = require('play-dl');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "!play";

client.on('ready', () => {
    console.log(`🤖 Bot de Discord conectado como: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const query = message.content.slice(PREFIX.length).trim();
    if (!query) return message.reply("⚠️ Ingresa el nombre de la canción. Ejemplo: `!play Siete Sentidos`");

    message.channel.send(`🔍 Buscando "${query}" para Julieth...`);

    try {
        const ytResults = await play.search(query, { limit: 1 });
        if (!ytResults || ytResults.length === 0) {
            return message.reply("❌ No encontré esa canción.");
        }

        const song = ytResults[0];
        const streamInfo = await play.stream(song.url);

        const songData = {
            title: song.title,
            artist: song.channel ? song.channel.name : "Artista",
            url: streamInfo.url,
            cover: song.thumbnails[0]?.url || "🪗",
            requestedBy: message.author.username
        };

        io.emit('new_song', songData);
        message.reply(`✅ ¡Reproduciendo en la web de Julieth!: **${song.title}** 🎵`);
    } catch (error) {
        console.error(error);
        message.reply("⚠️ Ocurrió un error al procesar el audio.");
    }
});

io.on('connection', (socket) => {
    console.log('🌐 Nueva conexión recibida desde la página web de Julieth');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);