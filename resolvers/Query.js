const {photos} = require('./datos')

module.exports = {
  totalPhotos: () => photos.length,
  allPhotos: () => photos,
  me: (parent, args, { currentUser }) => currentUser,
}