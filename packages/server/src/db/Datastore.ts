import { connect } from 'mongoose';

const DB_HOST = process.env.DB_HOST
console.info(`DB_HOST=${DB_HOST}`)


async function run() {
    const host = DB_HOST ?? 'localhost:27017'
    await connect(`mongodb://${host}/noir`);

}

run().then(() => console.info('DB connection established.')).catch(err => console.error(err));