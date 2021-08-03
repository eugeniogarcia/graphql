import React from 'react'
import { render } from 'react-dom'
import App from './App'
import { ApolloProvider } from 'react-apollo'
import ApolloClient, { InMemoryCache } from 'apollo-boost'
import { persistCache } from 'apollo-cache-persist'

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

//Creamos el cliente Apollo
//Especificamos que vamos a utilizar la cache que creamos antes
//Indicamos cual es el endpoint de Apollo Server
//Definimos un cross-cutting concern que se encarga de añadir la cabecera de autenticación
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

render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>,
    document.getElementById('root')
)