import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import { Query, Mutation, withApollo} from 'react-apollo'
import { flowRight as compose } from 'lodash';
import { ROOT_QUERY } from './App'
import { gql } from 'apollo-boost'

const GITHUB_AUTH_MUTATION = gql`
    mutation githubAuth($code:String!) {
        githubAuth(code:$code) { token }
    }
`

const CurrentUser = ({ name, avatar, logout }) =>
    <div>
        <img src={avatar} width={48} height={48} alt="" />
        <h1>{name}</h1>
        <button onClick={logout}>logout</button>
        <NavLink to="/newPhoto">Post Photo</NavLink>
    </div>

//Usa la mutación para leer los datos, pero al usar la policy cache-only obtiene los datos de la cache
//Muestra la información obtenida con la query me
const Me = ({ logout, requestCode, signingIn }) =>
    <Query query={ROOT_QUERY} fetchPolicy="cache-only">
        {({ loading, data }) => (data && data.me) ?
            <CurrentUser {...data.me} logout={logout} /> :
            loading ?
                <p>loading... </p> :
                <button onClick={requestCode}
                    disabled={signingIn}>
                    Sign In with Github
                </button>
        }
    </Query>

class AuthorizedUser extends Component {

    state = { signingIn: false }

    //Guarda el token en el localStorage
    authorizationComplete = (cache, { data }) => {
        localStorage.setItem('token', data.githubAuth.token)
        //Usa react-router para volver a la raiz
        this.props.history.replace('/')
        //Actualiza el estado, ya hemos hecho login
        this.setState({ signingIn: false })
    }

    //Una vez el DOM este listo
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

    //Hace logout
    logout = () => {
        //Borramos el token del localStorage
        localStorage.removeItem('token')
        //Lee la cache
        let data = this.props.client.readQuery({ query: ROOT_QUERY })
        data.me = null
        //Y la limpia
        this.props.client.writeQuery({ query: ROOT_QUERY, data })
    }

    //Navega a Github para conseguir un codigo de acceso
    requestCode() {
        var clientID = process.env.REACT_APP_CLIENT_ID
        window.location = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=user`
    }

    //Muestra el control Me, y prepara la mutación para hacer login con un código
    render() {
        return (
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
        )
    }
}

export default compose(withApollo, withRouter)(AuthorizedUser)