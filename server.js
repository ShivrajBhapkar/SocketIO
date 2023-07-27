const axios = require("axios");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const rateLimit = require("express-rate-limit");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "https://crypto-currency-trackker.netlify.app",
    },
});

const fetchData = async (currency) => {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

// Rate-limiting configuration
const rateLimitOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
};

// Apply rate-limiting middleware to the HTTP server
const limiter = rateLimit(rateLimitOptions);
app.use(limiter);

io.on("connection", (socket) => {
    // when connect
    console.log("a user connected");

    socket.on("initialData", async ({ initialData, currency }) => {
        socket.emit("updateData", initialData);
        const updateInterval = 60000; 
        const interval = setInterval(async () => {
            const newUpdatedData = await fetchData(currency);
            console.log(
                "Sending updated data to the client:",
                newUpdatedData[0].price_change_percentage_24h
            );
            if (newUpdatedData !== undefined) {
                socket.emit("updateData", newUpdatedData);
            }
        }, updateInterval);

        // Clean up interval on client disconnect
        socket.on("disconnect", () => {
            clearInterval(interval);
            console.log("a user disconnected!");
        });
    });
});

const port = 3001;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
