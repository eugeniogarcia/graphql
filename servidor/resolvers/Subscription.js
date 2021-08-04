const pubsub = require('./pubSub');

module.exports = {
    newPhoto: {
        subscribe: () => {
            pubsub.asyncIterator('photo-added');}
    },
    newUser: {
        subscribe: () => pubsub.asyncIterator(['user-added'])
    }
}