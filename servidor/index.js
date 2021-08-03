const express = require('express')
const { ApolloServer, PubSub } = require('apollo-server-express')
const { MongoClient } = require('mongodb')
const { readFileSync } = require('fs')
const expressPlayground = require('graphql-playground-middleware-express').default
const resolvers = require('./resolvers')

//para usar subscripciones
const { createServer } = require('http')
const path = require('path')
//para aplicar validaciones y restricciones a las queries
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')


require('dotenv').config()
var typeDefs = readFileSync('./typeDefs.graphql', 'UTF-8')

async function start() {
  const app = express()
  const MONGO_DB = process.env.DB_HOST
  let db

  //Para la gestión de las subscripciones
  const pubsub = new PubSub()

  try {
    const client = await MongoClient.connect(MONGO_DB, { useNewUrlParser: true })
    db = client.db()
  } catch (error) {
    console.log(`
    
      Mongo DB Host not found!
      please add DB_HOST environment variable to .env file

      exiting...
       
    `)
    process.exit(1)
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,

    engine: true,
    //Validaciones
    validationRules: [
      depthLimit(5),
      createComplexityLimitRule(1000, {
        onCost: cost => console.log('query cost: ', cost)
      })
    ],
    //Contexto
    context: async ({ req }) => {
      const githubToken = req.headers.authorization
      const currentUser = await db.collection('users').findOne({ githubToken })
      //En el contexto tenemos la base de datos, la subscripción, y en cada petición actualizamos la informaci´pon del usuario actual
      return { db, currentUser, pubsub }
    }
  })
  
  await server.start()

  server.applyMiddleware({ app })

  app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

  app.get('/', (req, res) => {
    let url = `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=user`
    res.end(`<a href="${url}">Sign In with Github</a>`)
  })

  app.use(
    '/img/photos',
    express.static(path.join(__dirname, 'assets', 'photos'))
  )

  //Para soportar subscripciones necesitamos un servidor http
  const httpServer = createServer(app)
  server.installSubscriptionHandlers(httpServer)
  httpServer.timeout = 5000

  //Usamos el servidor http en lugar de la propia app express, para escuchar en el puerto 4000
  httpServer.listen({ port: 4000 }, () =>
  //app.listen({ port: 4000 }, () =>
    console.log(`GraphQL Server running at http://localhost:4000${server.graphqlPath}`)
  )
}

start()
