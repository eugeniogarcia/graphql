# fetch

Para lanzar un query al servidor GraphQL basta con hacer un post al endpoint de graphql enviando el el mensaje la query o mutación que deseamos ejecutar:

```js
var query = `{totalPhotos, totalUsers}`

var url = 'http://localhost:4000/graphql'

var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
}

fetch(url, opts)
    .then(res => res.json())
    .then(console.log)
    .catch(console.error)
```

La respuesta será:

```js
{
    "data": {
        "totalPhotos": 4,
        "totalUsers": 7
    }
}
```

# graphql-request

Con `graphql-request` podemos hacer peticiones de forma alternativa:

```js
import { request } from 'graphql-request'

var query = `
    query listUsers {
        allUsers {
            name
            avatar
    }
}
`

request('http://localhost:4000/graphql', query)
.then(console.log)
.catch(console.error)
```

O si necesitamos enviar argumentos:

```js
request(url, mutation, {count:1})
.then(requestAndRender)
.catch(console.error)
```

# Apollo Client

Si necesitamos alguna capacidad más, como por ejemplo caching, necesitamos una linrería más especializada. Las más populares son `Relay` y `Apollo Client`. La primera es una contribución de Facebook que trabaja con React y React Native. La segunda es una contribución de Meteor y soporta una variedad de frameworks.

## Cliente

Podemos usar cache cuando hagamos las llamadas. En este caso vamos a definir una cache en memoria, y que se guarda en el _localStorage_ del cliente, de modo que podamos beneficiarnos de la cache entre sesiones:

```js
//Creamos una cache en memoria
const cache = new InMemoryCache()
//Creamos una cache con persistencia en el localStorage
persistCache({
    cache,
    storage: localStorage
})

//Comprobamos si en el localStorage hay alguna cache guardada, y si la hay, la leemos
if (localStorage['apollo-cache-persist']) {
    let cacheData = JSON.parse(localStorage['apollo-cache-persist'])
    cache.restore(cacheData)
}
```

Podemos crear el cliente, indicando que vamos a utilizar la cache que creamos antes. También podemos crear un cross-cutting concern que se encarga de añadir la cabecera de autenticación:

```js
const client = new ApolloClient({
    cache,
    uri: 'http://localhost:4000/graphql',
    request: operation => {
        operation.setContext(context => ({
            headers: {
                ...context.headers,
                authorization: localStorage.getItem('token')
            }
        }))
    }
})
```

Podemos usar el cliente como en los ejemplos anteriores:

```js
const query = gql`
{
    totalUsers
    totalPhotos
}
`

client.query({query})
    .then(() => console.log('cache', client.extract()))
    .catch(console.error)
```

Pero la librería incluye tambien unos componentes react que podemos usar para crear el cliente. Empezaríamos por crear el `ApolloProvider`. Este componente permite que todos los hijos tengan acceso al cliente Apollo:

```js
render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>,
    document.getElementById('root')
)
```

## Query

Definimos el esquema de graphql con `gql` como en los casos anteriores:

```js
export const ROOT_QUERY = gql`
    query allUsers {
        totalUsers        
        allUsers { ...userInfo }
        me { ...userInfo }
    }

    fragment userInfo on User {
        githubLogin
        name
        avatar
    }
`
```

Con el componente `Query` podemos ejecutar una query. En este caso estamos lanzando la query definida en *ROOT_QUERY*, es defir, estamos haciendo en la misma request tres peticiones, la petición _totalUsers_, _allUsers_ y la _me_:

```js
const Users = () =>
    <Query query={ROOT_QUERY} fetchPolicy="cache-and-network">
        {({ data, loading, refetch }) => loading ?
            <p>loading users...</p> :
            <UserList count={data.totalUsers}
                users={data.allUsers}
                refetch={refetch} />
        }
    </Query>
```

El componente hace la petición al servidor de Apollo y guarda la respuesta en la cache. En la respuesta no solo tenemos acceso a los datos, sino también al estado de la petición, y a una serie de métodos que nos permitirán hacer peticiones adicionales al servidor. __Todas estas propiedades se pasarán a los hijos como `props`__.

- _loading_ nos indica si tenemos o no ya la respuesta del servidor
- _data_ nos permite acceder a los datos. Por ejemplo, en _Data.totalUsers_ tendremos la respuesta a la query _totalusers_.
- _refetching_. Con este método podemos realizar una petición - que se salta la cache - al servidor Apollo. Cuando queramos hacer esto haremos una llamada a la función __refetching__
- _polling_. Nos permite establecer la frecuencia con la que se repetiruá la consulta - para refrescar los datos. Podríamos hacer lo siguiente:

```js
<Query query={ROOT_QUERY} fetchPolicy="cache-and-network" pollInterval={1000}>
```
- _stopPolling_. Funcion que detiene el pooling
- _startPolling_. Funcion que inicia el pooling
- _fetchmore_. Funcion que recupera otro lote de datos


## Mutation

Con el componente Mutation lo que hacemos es definir la mutación - y los argumentos que vamos a pasarla - y "empaquetar" la mutación como un método que se pasara vía `props` a los hijos del componente. Por ejemplo, si tenemos esta mutación:

```js
const ADD_FAKE_USERS_MUTATION = gql`
    mutation addFakeUsers($count:Int!) {
        addFakeUsers(count:$count) {  
            githubLogin
            name
            avatar
        }
    }
`
```

El componente Mutation se definirá así:

```js
<Mutation mutation={ADD_FAKE_USERS_MUTATION}
    variables={{ count: 1 }}
    update={updateUserCache}>
    {addFakeUsers =>
        <button onClick={addFakeUsers}>Add Fake User</button>
    }
</Mutation>
```

Hemos pasado como props al componente la mutación, las variables - argumentos -, así como un método - callback - que se ejecutará cuando la mutación termine. El componente pasara a sus hijos via `props` el método para hacer la mutación, de modo que serán los hijos los que efectivamente hagan la llamada a la mutación. En este caso tenemos un botón que al pulsarle hace la llamada a la mutación.

### Ejemplo. Autenticación

Los principios de diseño son:
- Usaremos OAuth2 con client credentials
- Cuando se refresque la página, comprobamos si en el windows.location tenemos el código de acceso, y si lo tenemos iniciamos la petición para obtener el token 

```js
componentDidMount() {
    //Comprueba si en la ubicación figura el código entre los query parameters
    if (window.location.search.match(/code=/)) {
        //Actualiza el estado para indicar que estamos haciendo el signin
        this.setState({ signingIn: true })
        //Obtenemos el código
        const code = window.location.search.replace("?code=", "")
        //Usamos la mutación para autenticar al usuario
        this.githubAuthMutation({ variables: { code } })
    }
}
```

Cuando hay un código de acceso disponible, usamos el método `this.githubAuthMutation` para obtener el token. Este método se ha "creado" con el componente `Mutation`:

```js
<Mutation mutation={GITHUB_AUTH_MUTATION}
    update={this.authorizationComplete}
    refetchQueries={[{ query: ROOT_QUERY }]}>
    {mutation => {
        //Hacemos que nuestro método se corresponda con el de la mutación
        this.githubAuthMutation = mutation
        //Retornamos nuestro componente
        return (
            <Me signingIn={this.state.signingIn}
                requestCode={this.requestCode}
                logout={this.logout} />
        )
    }}
</Mutation>
```

Podemos ver como usamos la mutación `GITHUB_AUTH_MUTATION`. El componente tiene dos `props` interesantes. Por un lado con `update` indicamos un callback a ejecutar cuando se obtiene la respuesta de la mutación. `refetchQueries` es otro callback que se usa para invocar a una query graphQl:

- El token lo guardamos en localStorage y en la cache, de modo que en todas las peticiones se incluya. Tomamos de `data.githubAuth.token` el token y lo guardamos en el localStorage, navegamos a la raiz de la aplicación, y actualizamos el estado:

```js
authorizationComplete = (cache, { data }) => {
    localStorage.setItem('token', data.githubAuth.token)
    //Usa react-router para volver a la raiz
    this.props.history.replace('/')
    //Actualiza el estado, ya hemos hecho login
    this.setState({ signingIn: false })
}
```

- Hacer un logout significa borrar de la cache y del localStorage el token

```js
logout = () => {
    //Borramos el token del localStorage
    localStorage.removeItem('token')
    //Lee la cache
    let data = this.props.client.readQuery({ query: ROOT_QUERY })
    data.me = null
    //Y la limpia
    this.props.client.writeQuery({ query: ROOT_QUERY, data })
}
```

## Cache

Cuando se hace una petición desde el cliente de Apollo, el resultado de la petición se guarda en una variable en memoria. Este comportamiento se puede modificar especificando una `fetchPolicy`. Hay varias políticas que pueden elegirse:

- `network-only`. No se usa la cache. Todas las peticiones se hacen al servidor de Apollo
- `cache-only`. Se recupera la información de la cache. Sino se encuentra el dato en la cache se dispara un error
- `cache-and-network`. Si el dato no esta en la cache, se busca en el servidor. Se actualiza la cache con la respuesta
- `no-cache`. Si el dato no esta en la cache, se busca en el servidor. No se actualiza la cache con la respuesta

### Guardar la cache

Con _apollo-cache-persist_ podemos guardar la información de la cache

```js
//Creamos una cache en memoria
const cache = new InMemoryCache()
//Creamos una cache con persistencia en el localStorage
persistCache({
    cache,
    storage: localStorage
})

//Comprobamos si en el localStorage hay alguna cache guardada, y si la hay, la leemos
if (localStorage['apollo-cache-persist']) {
    let cacheData = JSON.parse(localStorage['apollo-cache-persist'])
    cache.restore(cacheData)
}
```

### Actualizar y leer la cache

El cliente Apollo ofrece una par de apis para leer y escribir directamente en la cache. Podemos leer el contenido de la cache:

```js
let { totalUsers, allUsers, me } = cache.readQuery({ query: ROOT_QUERY })
```

Podemos actualizar la cache:

```js
cache.writeQuery({
    query: ROOT_QUERY,
        data: {
        me: null,
        allUsers: [],
        totalUsers: 0
    }
})
```

## Subscripciones

### Setup

Necesitamos utilizar websockets para consumir una subscripción. Tenemos que instalar en el cliente las siguientes librerias:

```ps
npm install apollo-link-ws apollo-utilities subscriptions-transport-ws
```

Añadimos los siguientes módulos en index.js:

```js
import { HttpLink, ApolloLink, split} from 'apollo-boost'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
```

### 