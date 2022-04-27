import { connect } from 'mongoose';

async function run() {
    await connect('mongodb://localhost:27017/noir');
    
}

run().then(() => console.info('DB connection established.')).catch(err => console.error(err));