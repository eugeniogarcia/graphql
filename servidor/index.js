const { createServer } = require('http')
const { execute, subscribe } = require( 'graphql');
const { SubscriptionServer } = require( 'subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const express = require('express')
const { ApolloServer} = require('apollo-server-express')
const { MongoClient } = require('mongodb')
const { readFileSync } = require('fs')
const expressPlayground = require('graphql-playground-middleware-express').default
const resolvers = require('./resolvers')

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
  const pubsub = require ('./resolvers/pubSub');

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

  //Helper que nos permite definir el esquema en base a los tipos y resolvers
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  //Creamos el servidor Apollo
  const server = new ApolloServer({
    schema,
    engine: true,
    //Validaciones
    validationRules: [
      depthLimit(5),
      createComplexityLimitRule(1000, {
        onCost: cost => console.log('query cost: ', cost)
      })
    ],
    //Contexto
    context: async ({ req, connection }) => {
      const githubToken = req ? req.headers.authorization :connection.context.Authorization
      const currentUser = await db.collection('users').findOne({ githubToken })
      return { db, currentUser, pubsub }
    }
    /*    
    context: async ({ req }) => {
      const githubToken = req.headers.authorization
      const currentUser = await db.collection('users').findOne({ githubToken })
      //En el contexto tenemos la base de datos, la subscripción, y en cada petición actualizamos la informaci´pon del usuario actual
      return { db, currentUser, pubsub }
    }
    */
  })

  const httpServer = createServer(app)
  httpServer.timeout = 5000

  await server.start()

  //Creamos el servidor de subscripciones (procesa las conexiones websocket)
  const subscriptionServer = SubscriptionServer.create({
    schema,    
    // These are imported from `graphql`.
    execute,
    subscribe,
  }, {
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // This `server` is the instance returned from `new ApolloServer`.
    path: server.graphqlPath,
  });

  // Shut down in the case of interrupt and termination signals
  // We expect to handle this more cleanly in the future. See (#5074)[https://github.com/apollographql/apollo-server/issues/5074] for reference.
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => subscriptionServer.close());
  });

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

  //Usamos el servidor http en lugar de la propia app express, para escuchar en el puerto 4000
  httpServer.listen({ port: 4000 }, () =>
  //app.listen({ port: 4000 }, () =>
    console.log(`GraphQL Server running at http://localhost:4000${server.graphqlPath}`)
  )
}

start()
