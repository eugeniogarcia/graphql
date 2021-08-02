import React from 'react'
import ReactDOM from 'react-dom'
import { request } from 'graphql-request'

var url = 'http://localhost:4000/graphql'

var query = `
query listUsers {
    allUsers {
        avatar
        name
    }
}
`

var mutation = `
mutation populate($count: Int!) {
    addFakeUsers(count:$count) {
        githubLogin
    }
}
`

const App = ({ users = [] }) =>
    (<div>
        {users.map(user =>
            <div key={user.githubLogin}>
                <img src={user.avatar} alt="" />
                {user.name}
            </div>
        )}
        <button onClick={addUser}>Add User</button>
    </div>);

const addUser = () =>
    request(url, mutation, { count: 1 })
        .then(requestAndRender)
        .catch(console.error);

const render = ({ allUsers = [] }) =>
    ReactDOM.render(
        <App users={allUsers} />,
        document.getElementById('root')
    );

const requestAndRender = () =>
    request(url, query)
        .then(render)
        .catch(console.error);

requestAndRender()