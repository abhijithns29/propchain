const mongoose = require('mongoose');
require('../../server/models/Chat');
require('../../server/models/Land');
require('../../server/models/User');

const Chat = mongoose.model('Chat');

const purgeChats = async () => {
    try {
        await mongoose.connect('mongodb://localhost/landregistry');
        console.log('✅ Connected to DB');
        
        const count = await Chat.countDocuments();
        console.log(`Found ${count} existing chat records.`);
        
        if (count > 0) {
            await Chat.deleteMany({});
            console.log(`🗑️ Successfully deleted ALL ${count} chats.`);
        } else {
            console.log("No chats to delete.");
        }
        
    } catch (error) {
        console.error('Error purging chats:', error);
    } finally {
        process.exit(0);
    }
};

purgeChats();
