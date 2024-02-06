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

// Rate-limiting configuration for Coingecko API calls
const coingeckoRateLimitOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute (adjust according to Coingecko's rate limits)
};

const coingeckoLimiter = rateLimit(coingeckoRateLimitOptions);
app.use("https://api.coingecko.com/api/", coingeckoLimiter);
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

let interval; 
io.on("connection", (socket) => {
    // when connect
    if (interval) {
         console.log("clear");
         clearInterval(interval);
     }
    console.log("a user connected");

    socket.on("initialData", async ({ currency }) => {
        console.log("inside");
        const updateInterval = 30000;
         interval = setInterval(async () => {
            const newUpdatedData = await fetchData(currency);
             if (newUpdatedData !== undefined) {
             console.log(newUpdatedData , "updated data");
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
