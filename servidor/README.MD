# Instalacion

Hay que actualizar los valores de la variables de entorno en `.env`:

```
DB_HOST=<YOUR_MONGODB_HOST>
CLIENT_ID=<YOUR_GITHUB_CLIENT_ID>
CLIENT_SECRET=<YOUR_GITHUB_CLIENT_SECRET>
```

Podemos acceder a la aplicación haciendo `npm run start` y luego en `http://localhost:4000/playground` o en `http://localhost:4000/graphql`.

## OAuth

Podemos obtener el código de acceso :

```
https://github.com/login/oauth/authorize?client_id=ecaaa518337cf8132ab5&scope=user
```

Después de incluir las credenciales, en el redirect podemos acceder al código:

```
http://localhost:3000/?code=74af61b0d1e42c345167
```

# Grafos

Grafos nos permiten representar datos que estan interconectados. Podemos hablar de nodos y _edges_. Los _edges_ pueden tener direccion o no. Un árbol binario se caracteriza por ejemplo porque cada nodo tiene dos _edges_, y porque estos _edges_ tienen dirección.

Él padre de la teoría de grafos es __Euler__. Se le planteo a Euler el problema de Königsberg, o como recorrer los siete puentes de la ciudad sin pasar dos veces por ninguno de ellos. Esto es lo que se denomina una ruta Euleriana - _Eulerian path_. Un ciclo Euleriano - _Eulerian cycle_ - es una trayectoria en que se inicia y termina en el mismo nodo, y que pasa por cada nodo una sola vez.

# Tipos

## Comentarios

Podemos incluir comentarios con `"""`:

```js
"""
Usuario autorizado en Githib
"""
type User {
    """
    Id de GitHub
    """
    githubLogin: ID!
```

## Tipos

Los tipos básicos son ID, String, Int, y Boolean. Podemos crear nuestros propios tipos:

```js
scalar DateTime

"""
Usuario autorizado en Githib
"""
type User {
    """
    Id de GitHub
    """
    githubLogin: ID!
    """
    Nombre y apellidos
```

## Edges (o relaciones)

Podemos establecer relaciones entre los distintos tipos que nos permitiran definir un grafo con la forma en la que se relacionan los distintos tipos - nodos del grafo. Las relaciones pueden ser 1:1, 1:n o n:n, y pueden ser o no bidireccionales. La forma en la que que se define una relación es muy sencilla:


- Establecemos una relación 1:n direccional entre  _User_ y _Photo_ con los campos _postedBy_ y _postedPhotos_. Podemos en todo momento saber a partir de un _User_ cuales son sus _Photos_ y desde una _Photo_ saber cual es el usuario que la creo
- Establecemos una relación 1 a n  _Photo_ y _User_ con el campo _taggedUsers_. Podemos desde una _Photo_ saber cuales son los _Users_ en la foto, pero no al reves, a partir de un _User_ no sabemos en que _Photos_ esta presente: 

```js
"""
Usuario autorizado en Githib
"""
type User {
    """
    Fotos publicadas por el usuario
    """
    postedPhotos: [Photo!]!
    """

    etc...
}

"""
Detalles de una foto
"""
type Photo {
    """
    Usuario que publica la foto
    """
    postedBy: User!
    """
    Usuarios que están identificados en la foto
    """
    taggedUsers: [User!]!

    etc...
}
```

## Fragments

Podemos crear un fragmento para aquellos casos en los que sin ser un tipo, hay una porción, un fragmento, que se usa repetidas veces. Aqui definimos un fragment basado en el tipo `Lift`:

```js
fragment liftInfo on Lift {
    name
    status
    capacity
    night
    elevationGain
}
```

Podemos usar el fragmento:

```js
query {
    Lift(id: "jazz-cat") {
    ...liftInfo
    trailAccess {
        name
        difficulty
    }
}
```

## Union Types

```js
union AgendaItem = StudyGroup | Workout

type StudyGroup {
    name: String!
    subject: String
    students: [User!]!
}

type Workout {
    name: String!
    reps: Int!
}
```

podemos utilizarle como cualquier otro tipo:

```js
type Query {
agenda: [AgendaItem!]!
}
```

Aunque se trata de dos tipos en uno. Por ejemplo, podemos crear un fragmento que muestre unos campos u otros en función del tipo de que se trate:

```js
query today {
    agenda {
        ...workout
        ...study
    }
}

fragment workout on Workout {
    name
    reps
}

fragment study on StudyGroup {
    name
    subject
    students
}
```

Tambien podemos definir fragmentos _inline_:

```js
query schedule {
    agenda {
        ...on Workout {
            name
            reps
        }

        ...on StudyGroup {
        name
            subject
            students
        }
    }
}
```

## Interfaces

Podemos tambien definir interfaces, y crear tipos que implementen el interface:

```js
interface AgendaItem {
    name: String!
    start: DateTime!
    end: DateTime!
}

type StudyGroup implements AgendaItem {
    name: String!
    start: DateTime!
    end: DateTime!
    participants: [User!]!
    topic: String!
}

type Workout implements AgendaItem {
    name: String!
    start: DateTime!
    end: DateTime!
    reps: Int!
}
```

## Argumentos

Cuando los argumentos de entrada se utilizan en más de una función nos puede intersar un _input_. Aqui por ejemplo definimos un tipo:

```js
"""
Datos de entrada para una foto
"""
input PostPhotoInput {
    """
    Nombre
    """
    name: String!
    """
    Categoria de la foto (por defecto es Retrato)
    """
    category: PhotoCategory = PORTRAIT
    """
    Descripción de la foto
    """
    description: String
}
```

Lo podemos usar al definir una query o una mutación. Por ejemplo:

```js
type Mutation {
    """
    Guarda una foto
    """
    postPhoto(
        """
        Datos de la foto a crear
        """
        input: PostPhotoInput!
    ): Photo!
```

Notese que a la hora de crear el resolver el argumento de entrada pasara a tener un elemento llamado _input_ en el que podremos acceder a nuestro objeto de entrada - en este ejemplo podemos verlo en __...args.input__:

```js
postPhoto: async function (parent, args, { db, currentUser }){
    if (!currentUser) {
      throw new Error('only an authorized user can post a photo')
    }

    const newPhoto = {
      ...args.input,
      userID: currentUser.githubLogin,
      created: new Date()
    }
```

## Enums

Podemos definir una enumeración:

```js
"""
Lista de categorias de fotos
"""
enum PhotoCategory {
    """
    Selfie
    """
    SELFIE
    """
    Retrato
    """
    PORTRAIT
    """
    Acción
    """
    ACTION
    """
    Panorama
    """
    LANDSCAPE
    """
    Graficos
    """
    GRAPHIC
}
```

Por ejemplo en el input podemos definir el tipo de uno de los argumentos como la enumeración anterior, e incluso dar un valor por defecto. Por ejemplo, aquí el argumento _category_ es de nuestro tipo enum, y tiene un valor por defecto _PORTRAIT_:

```js
input PostPhotoInput {
    """
    Nombre
    """
    name: String!
    """
    Categoria de la foto (por defecto es Retrato)
    """
    category: PhotoCategory = PORTRAIT
    """
    Descripción de la foto
    """
    description: String
}
```

# Resolvers

En el esquema hemos definido todos los tipos y las operaciones que pueden hacerse con la API. En el resolver vamos a indicar cuales de los tipos son tipos raiz. Siempre tenemos que obligatoriamente tener dos tipos raiz, __Query__ y __Mutation__, y opcionalmente aquellos que necesitemos para resolver algun otro tipo - más sobre esto a continuación.

En el tipo __Query__ definiremos todas las operaciones de consulta que vamos a poder lanzar con nuestra api, y en __Mutation__ todas aquellas operaciones de modificación (modificación, borrado e inserción).

Adicionalmente habrá ocasiones en las que queramos _resolver_ algún otro tipo, por ejemplo, para automáticamente informar algun atributo como puede ser un time-stamp. También podemos definir tipos scalares. Los tipos escalareas se implementan también en el resolver.

## Tipo escalar

Supongamos que queremos definir un tipo escalar. Lo definieremos en nuestro esquema:

```js
scalar timestamp

"""
Detalles de una foto
"""
type Photo {
    """
    Cuando se creo la foto
    """
    created: timestamp!

    etc...
}
```

En el resolver indicaremos en que consiste este tipo. Nuestro resolver tendrá la siguiente pinta:

```js
{
    Query:{

    },
    Mutation:{

    },
    timestamp: new GraphQLScalarType({
        name: 'timestamp',
        description: 'A valid date time value.',
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseLiteral: ast => ast.value
    } 
}
```

Definimos el tipo con `GraphQLScalarType`, indicamos el nombre, así como la forma en que se debe serializar, y procesar el valor.

## Index.js

Es muy habitual tener los distintos resolvers en diferentes modulos. Podemos combinarlos todos creando un directorio con todos ellos, y un _index.js_ que los agrupe todos en nuestro resolver:

```js
const Query = require('./Query')
const Mutation = require('./Mutation')
const Type = require('./Type')

const resolvers = {
  Query,
  Mutation,
  ...Type
}

module.exports = resolvers
```

Notese como _Query_ y _Mutation_ son dos modulos que importamos de forma independiente. En _Type_ hemos definido un módulo que tiene que tener como Elemento cada uno de los _root types que queramos resolver_. Notese que hemos usado el operador `...`, de modo que en Type esperamos cada uno de los tipos definido como elemento:

```js
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
```

Efectivamente tenemos los escalares que hemos definido, así como resolvers para _User_ y _Photo_.

## Root types - otros Photo y User

Dejamos para el final los root types _Query_ y _Mutation_. Hemos añadido, de forma opcional, dos tipos root para _Photo_ y _User_. Cuando alguna _Query_ o _Mutation_ retorne un tipo como _Photo_ o _User_, lo que se hara por defecto es retornar el tipo tal cual lo genere el resolver. Si queremos "manipularlo" podemos crear un root resolver. Por ejemplo, en nuestro caso cuando se este retornando un _Photo_:

```js
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
```

- El campo _id_ se informará a partir del _parent_
- El campo _url_ se calculará con el parent
- Los campos _postedBy_ y _taggedUsers_ se informan con los datos recuperados de la base de datos para el _parent.userID_ y el _parent.id_

Notese como todos los resolvers tienen la siguiente firma __(parent, args, context)__. Con parent accedemos a los datos que estan llegando al resolver. Asi en este caso _parent_ hace referencia a la _Photo_ que llega como entrada al resolver. El resolver transformará esta _Photo_ y será este resultado transformado el que se devuelva con la api.

## Contexto

En el contexto incluiremos todos aquellos __cross-cutting concerns__ que sean necesarios al implementar los distintos resolvers. Al instanciar el servidor de Apollo, además de indicar el schema y los resolvers, podemos __opcionalmente__ indicar un contexto.

El contexto puede ser un objeto o método. Usaremos un objeto cuando el _contenido_ no deba cambiar de petición a petición. Si por el contrario en cada petición tenemos que _revisar_ el contexto, especificaremos el contexto como un método. De esta forma el método que especifiquemos se invocará con cada petición. 

En este caso hemos definido un método, porque queremos ver cual es la cabecera de autenticación para obtener los datos del usuario. 

```js
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const githubToken = req.headers.authorization
      const currentUser = await db.collection('users').findOne({ githubToken })
      return { db, currentUser }
    }
  })
```

El contexto en nuestro caso es:

```js
{ db, currentUser }
```

Es decir la base de datos de mongo - que no cambia de petición a petición - y el usuario - que actualizamos/verificamos en cada petición.

# Subscripciones

## Setup

Instalamos las librerias necesarias para soportar subscripciones:

```ps
npm install subscriptions-transport-ws @graphql-tools/schema graphql-subscriptions
```
Las subscripciones utilizan websockets. Apollo Server incluye esta funcionalidad, pero necesitamos usar un servidor http:

```js
const { createServer } = require('http')
const { execute, subscribe } = require( 'graphql');
const { SubscriptionServer } = require( 'subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { PubSub } = require('graphql-subscriptions')

etc...

//Para la gestión de las subscripciones
const pubsub = new PubSub()

etc...

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
context: async ({ req }) => {
    const githubToken = req.headers.authorization
    const currentUser = await db.collection('users').findOne({ githubToken })
    //En el contexto tenemos la base de datos, la subscripción, y en cada petición actualizamos la informaci´pon del usuario actual
    return { db, currentUser, pubsub }
}
})

etc...

const httpServer = createServer(app)
httpServer.timeout = 5000

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

etc...

//Usamos el servidor http en lugar de la propia app express, para escuchar en el puerto 4000
httpServer.listen({ port: 4000 }, () =>
//app.listen({ port: 4000 }, () =>
```

## GraphQl schema

Tenemos que incluir otro tipo Root, _Subscriptions_ con las subscripciones que queremos escuchar:

```js
type Subscription {
    newPhoto: Photo!
    newUser: User!
}
```

Tendremos que hacer modificaciones a los resolvers, por un lado creando nuevos resolvers asociados directamente a la subscripción, y por otro lado modificando aquellas mutaciones en las que necesitemos publicar el evento.

## Resolvers. Disparar el evento

Modificaremos las mutaciones encargadas de crear una nueva foto o usuario, para que publiquen un evento. Por ejemplo, cuando se cree una nueva foto, publicaremos el evento `photo-added` con los datos de la foto, _newPhoto_:

```js
module.exports = {

  postPhoto: async function (parent, args, { db, currentUser, pubsub }){

    etc...

    pubsub.publish('photo-added', { newPhoto })

    return newPhoto

  },
```

Finalmente en el resolver que implementa _Subscription_, tendremos que incluir para cada tipo definido en el esquema, su implementación. Por ejemplo, con _newPhoto_ nos subscribimos al evento `photo-added` que acabamos de crear:

```js
module.exports = {
    newPhoto: {
        subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator('photo-added')
    },

etc...
```

__Los resolvers de Subscripciones contienen el método subscribe__.

En todos estos resolvers, el que publica el evento y el que lo consume, esperan que haya un contexto, y de ese contexto estamos tomando el _pubsub_ para publicar o consumir los eventos.

```js
const { ApolloServer, PubSub } = require('apollo-server-express')

etc...

//Para la gestión de las subscripciones
const pubsub = new PubSub()

etc...

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
```

# Enviar Archivos como argumentos (a una Mutacion GraphQL)

# Validaciones

```ps
npm install graphql-depth-limit graphql-validation-complexity
```

