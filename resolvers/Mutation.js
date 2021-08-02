const { authorizeWithGithub}=require('../lib')


module.exports = {

  postPhoto: async function (parent, args, { db, currentUser }){
    if (!currentUser) {
      throw new Error('only an authorized user can post a photo')
    }

    const newPhoto = {
      ...args.input,
      userID: currentUser.githubLogin,
      created: new Date()
    }

    const { insertedIds } = await db.collection('photos').insert(newPhoto)
    newPhoto.id = insertedIds[0]

    return newPhoto
  },

  async creaPhoto(parent, args, { db, currentUser }) {
    if (!currentUser) {
      throw new Error('only an authorized user can post a photo')
    }
    
    const newPhoto = {
      ...args.input,
      userID: currentUser.githubLogin,
      created: new Date()
    }

    const { insertedIds } = await db.collection('photos').insert(newPhoto)
    newPhoto.id = insertedIds[0]
    
    return newPhoto
  },

  async githubAuth(parent, { code }, { db }) {
    // 1. Obtain data from GitHub
    let {message,access_token,avatar_url,login,name} = await authorizeWithGithub({
      client_id: 'ecaaa518337cf8132ab5',
      client_secret: 'd0e7c8a021a9c4ef5c1671de598b3669fdd52f84',
      code})

      // 2. If there is a message, something went wrong
      if (message) {throw new Error(message)}
            
      // 3. Package the results into a single object
      let latestUserInfo = {
        name,
        githubLogin: login,
        githubToken: access_token,
        avatar: avatar_url
      }
    console.log(latestUserInfo)

      // 4. Add or update the record with the new information
      const respuesta = await db.collection('users').replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true })
      console.log(respuesta)

      return { 
      user:{
        githubLogin: latestUserInfo.githubLogin,
        name: latestUserInfo.name,
        avatar: latestUserInfo.avatar,
      },
      token: access_token 
    }
  },
  
  addFakeUsers: async (root, { count }, { db }) => {
    var randomUserApi = `https://randomuser.me/api/?results=${count}`
  
    var { results } = await fetch(randomUserApi)
      .then(res => res.json())
  
    var users = results.map(r => ({
      githubLogin: r.login.username,
      name: `${r.name.first} ${r.name.last}`,
      avatar: r.picture.thumbnail,
      githubToken: r.login.sha1
    }))
    
    await db.collection('users').insert(users)
    return users
  },

  async fakeUserAuth(parent, { githubLogin }, { db }) {
    var user = await db.collection('users').findOne({ githubLogin })
    
    if (!user) {
      throw new Error(`Cannot find user with githubLogin "${githubLogin}"`)
    }
    
    return {
      token: user.githubToken,
      user
    }
  }
}