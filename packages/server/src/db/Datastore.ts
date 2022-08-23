import mongoose from 'mongoose';

const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING
console.info(`DB_CONNECTION_STRING=${DB_CONNECTION_STRING}`)

const connectionString = DB_CONNECTION_STRING ?? 'mongodb://localhost:27017/noir'

async function connect() {
    return await mongoose.connect(connectionString, {
        connectTimeoutMS: 5000
    });
}

async function openInitialConnection() {
    connect().catch(err => {
        console.error(err);
        openInitialConnection();
    })
}

mongoose.connection.on('connecting', () => console.info("DB: Opening initial connection..."));
mongoose.connection.once('connected', () => console.info("DB: Connected."));
mongoose.connection.on('reconnected', () => console.info("DB: Reconnected."));
mongoose.connection.on('disconnected', () => console.info("DB: Disconnected."));

openInitialConnection();