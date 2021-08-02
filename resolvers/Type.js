const { GraphQLScalarType } = require('graphql')

module.exports = {

    Photo: {

        id: parent => parent.id || parent._id,

        url: parent => `/img/photos/${parent._id}.jpg`,

        postedBy: (parent, args, { db }) =>
            db.collection('users').findOne({ githubLogin: parent.userID }),

        taggedUsers: parent => {
            return tags.filter(u => u.photoID === parent.id)
                .map(tag => tag.userID)
                .map(userID => users.find(u => u.githubLogin === userID))
        }

    },

    User: {
        postedPhotos: parent => {
            return photos.filter(p => p.githubUser === parent.githubLogin)
        },

        inPhotos: parent => {
            return tags.filter(p => p.userID === parent.githubLogin)
                .map(tag => tag.photoID)
                .map(photoID => photos.find(p => p.id === photoID))
        }

    },

    timestamp: new GraphQLScalarType({
        name: 'timestamp',
        description: 'A valid date time value.',
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseLiteral: ast => ast.value
    })
}