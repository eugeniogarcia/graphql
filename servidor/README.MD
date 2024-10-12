# Introduccion GraphQL

The information is taken from [graphql](https://graphql.org/learn/)

GraphQL is a query language for your API, and a server-side runtime for executing queries using a type system you define for your data. GraphQL isn't tied to any specific database or storage engine and is instead backed by your existing code and data.

__A GraphQL service is created by defining types and fields on those types__, then __providing functions for each field on each type__. For example, a GraphQL service that tells you who the logged in user is (me) as well as that user's name might look like this:

```json
type Query {
  me: User
}
 
type User {
  id: ID
  name: String
}
```

__Along with functions for each field on each type__:

```json
function Query_me(request) {
  return request.auth.user
}
 
function User_name(user) {
  return user.getName()
}
```

After a GraphQL service is running (typically at a URL on a web service), it can receive GraphQL queries to validate and execute. The service first checks a query to __ensure it only refers to the types and fields defined__, and then runs the provided functions to produce a result.

For example, the query:

```json
{
  me {
    name
  }
}
```

Could produce the following JSON result:

```json
{
  "me": {
    "name": "Luke Skywalker"
  }
}
```

## Queries and Mutations

### Fields

At its simplest, GraphQL is about asking for specific fields on objects. Let's start by looking at a very simple query and the result we get when we run it:

```json
{
  hero {
    name
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    }
  }
}
```

You can see immediately that __the query has exactly the same shape as the result__. This is essential to GraphQL, because you always get back what you expect, and the server knows exactly what fields the client is asking for.

The field name returns a String type, in this case the name of the main hero of Star Wars, "R2-D2".

In the previous example, we just asked for the name of our hero which returned a String, but fields can also refer to Objects. In that case, you can make a sub-selection of fields for that object. GraphQL queries can traverse related objects and their fields, letting clients fetch lots of related data in one request, instead of making several roundtrips as one would need in a classic REST architecture.

```json
hero {
    name
    # Queries can have comments!
    friends {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

Note that in this example, __the friends field returns an array of items__. GraphQL queries look the same for both single items or lists of items; however, we know which one to expect based on what is indicated in the schema.

### Arguments

If the only thing we could do was traverse objects and their fields, GraphQL would already be a very useful language for data fetching. But when you add the ability to pass arguments to fields, things get much more interesting.

```json
{
  human(id: "1000") {
    name
    height
  }
}
```

returns:

```json
{
  "data": {
    "human": {
      "name": "Luke Skywalker",
      "height": 1.72
    }
  }
}
```

__In a system like REST, you can only pass a single set of arguments__ - the query parameters and URL segments in your request. __But in GraphQL, every field and nested object can get its own set of arguments__, making GraphQL a complete replacement for making multiple API fetches. You can even pass arguments into scalar fields, to implement data transformations once on the server, instead of on every client separately.

```json
{
  human(id: "1000") {
    name
    height(unit: FOOT)
  }
}
```

returns:

```json
{
  "data": {
    "human": {
      "name": "Luke Skywalker",
      "height": 5.6430448
    }
  }
}
```

__Arguments can be of many different types__. In the above example, we have used an Enumeration type, which represents one of a finite set of options (in this case, units of length, either METER or FOOT). GraphQL comes with a default set of types, but a GraphQL server can also declare its own custom types, as long as they can be serialized into your transport format.

### Aliases

If you have a sharp eye, you may have noticed that, since the result object fields match the name of the field in the query but don't include arguments, you can't directly query for the same field with different arguments. __That's why you need aliases__ - they let you rename the result of a field to anything you want.

```json
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}
```

returns:

```json
{
  "data": {
    "empireHero": {
      "name": "Luke Skywalker"
    },
    "jediHero": {
      "name": "R2-D2"
    }
  }
}
```

In the above example, the two hero fields would have conflicted, but since we can alias them to different names, we can get both results in one request.

### Fragments

Let's say we had a relatively complicated page in our app, which lets us look at two heroes side by side, along with their friends. You can imagine that such a query could quickly get complicated, because we would need to repeat the fields at least once - one for each side of the comparison.

That's why GraphQL includes reusable units called fragments. Fragments let you construct sets of fields, and then include them in queries where you need to. Here's an example of how you could solve the above situation using fragments:

```json
{
  leftComparison: hero(episode: EMPIRE) {
    ...comparisonFields
  }
  rightComparison: hero(episode: JEDI) {
    ...comparisonFields
  }
}

fragment comparisonFields on Character {
  name
  appearsIn
  friends {
    name
  }
}
```

will return:

```json
{
  "data": {
    "leftComparison": {
      "name": "Luke Skywalker",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        },
        {
          "name": "C-3PO"
        },
        {
          "name": "R2-D2"
        }
      ]
    },
    "rightComparison": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

You can see how the above query would be pretty repetitive if the fields were repeated. The concept of fragments is frequently used to split complicated application data requirements into smaller chunks, especially when you need to combine lots of UI components with different fragments into one initial data fetch.

### Using variables inside fragments

It is possible for __fragments to access variables declared in the query or mutation__. See variables.

```json
query HeroComparison($first: Int = 3) {
  leftComparison: hero(episode: EMPIRE) {
    ...comparisonFields
  }
  rightComparison: hero(episode: JEDI) {
    ...comparisonFields
  }
}

fragment comparisonFields on Character {
  name
  friendsConnection(first: $first) {
    totalCount
    edges {
      node {
        name
      }
    }
  }
}
```

returns:

```json
{
  "data": {
    "leftComparison": {
      "name": "Luke Skywalker",
      "friendsConnection": {
        "totalCount": 4,
        "edges": [
          {
            "node": {
              "name": "Han Solo"
            }
          },
          {
            "node": {
              "name": "Leia Organa"
            }
          },
          {
            "node": {
              "name": "C-3PO"
            }
          }
        ]
      }
    },
    "rightComparison": {
      "name": "R2-D2",
      "friendsConnection": {
        "totalCount": 3,
        "edges": [
          {
            "node": {
              "name": "Luke Skywalker"
            }
          },
          {
            "node": {
              "name": "Han Solo"
            }
          },
          {
            "node": {
              "name": "Leia Organa"
            }
          }
        ]
      }
    }
  }
}
```

### Operation name

In several of the examples above __we have been using a shorthand syntax where we omit both the query keyword and the query name__, but in production apps it's useful to use these to make our code less ambiguous.

Here's an example that __includes the keyword query as operation type and HeroNameAndFriends as operation name__:

```json
query HeroNameAndFriends {
  hero {
    name
    friends {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

The operation type is either __`query`, `mutation`, or `subscription`__ and describes what type of operation you're intending to do. The operation type is required unless you're using the query shorthand syntax, in which case you can't supply a name or variable definitions for your operation.

__The operation name is a meaningful and explicit name for your operation__. It is only required in multi-operation documents, but its use is encouraged because it is very helpful for debugging and server-side logging. When something goes wrong (you see errors either in your network logs, or in the logs of your GraphQL server) it is easier to identify a query in your codebase by name instead of trying to decipher the contents. Think of this just like a function name in your favorite programming language. For example, in JavaScript we can easily work only with anonymous functions, but when we give a function a name, it's easier to track it down, debug our code, and log when it's called. In the same way, GraphQL query and mutation names, along with fragment names, can be a useful debugging tool on the server side to identify different GraphQL requests.

### Variables

So far, we have been writing all of our arguments inside the query string. But in most applications, __the arguments to fields will be dynamic__: For example, there might be a dropdown that lets you select which Star Wars episode you are interested in, or a search field, or a set of filters.

It wouldn't be a good idea to pass these dynamic arguments directly in the query string, because then our client-side code would need to dynamically manipulate the query string at runtime, __and serialize it into a GraphQL-specific format__. Instead, GraphQL has a first-class way to factor dynamic values out of the query, and pass them as a separate dictionary. These values are called variables.

When we start working with variables, we need to do three things:

- __Replace the static value in the query with `$variableName`__
- Declare `$variableName` as __one of the variables accepted by the query__
- __Pass `variableName`: value in the separate, transport-specific (usually JSON) variables dictionary__

Here's what it looks like all together:

```json
query HeroNameAndFriends($episode: Episode) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

we pass the value of the variable:

```json
{
  "episode": "JEDI"
}
```

and returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "friends": [
        {
          "name": "Luke Skywalker"
        },
        {
          "name": "Han Solo"
        },
        {
          "name": "Leia Organa"
        }
      ]
    }
  }
}
```

Now, __in our client code, we can simply pass a different variable__ rather than needing to construct an entirely new query. This is also in general a good practice for denoting which arguments in our query are expected to be dynamic - we should never be doing string interpolation to construct queries from user-supplied values.

### Variable definitions

The variable definitions are the part that looks like `($episode: Episode)` in the query above. It works just like the argument definitions for a function in a typed language. It lists all of the variables, prefixed by $, followed by their type, in this case Episode.

__All declared variables must be either `scalars`, `enums`, or `input object types`__. So if you want to pass a complex object into a field, you need to know what input type that matches on the server. Learn more about input object types on the Schema section.

__Variable definitions can be optional or required__. In the case above, since there isn't an `!` next to the Episode type, it's optional. But if the field you are passing the variable into requires a non-null argument, then the variable has to be required as well.

### Default variables

__Default values can also be assigned to the variables in the query__ by adding the default value after the type declaration.

```json
query HeroNameAndFriends($episode: Episode = JEDI) {
  hero(episode: $episode) {
    name
    friends {
      name
    }
  }
}
```

When default values are provided for all variables, you can call the query without passing any variables. If any variables are passed as part of the variables dictionary, they will override the defaults.

### Directives

We discussed above how variables enable us to avoid doing manual string interpolation to construct dynamic queries. Passing variables in arguments solves a pretty big class of these problems, but we might also need a way to dynamically change the structure and shape of our queries using variables. For example, we can imagine a UI component that has a summarized and detailed view, where one includes more fields than the other.

Let's construct a query for such a component:

```json
query Hero($episode: Episode, $withFriends: Boolean!) {
  hero(episode: $episode) {
    name
    friends @include(if: $withFriends) {
      name
    }
  }
}
```

with variables:

```json
{
  "episode": "JEDI",
  "withFriends": false
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    }
  }
}
```

Try editing the variables above to instead pass `true` for `withFriends`, and see how the result changes.

__We needed to use a new feature in GraphQL called a directive__. A directive can be attached to a field or fragment inclusion, and can affect execution of the query in any way the server desires. __The core GraphQL specification includes exactly two directives__, which must be supported by any spec-compliant GraphQL server implementation:

- `@include(if: Boolean)` Only __include this field in the result if the argument is true__.
- `@skip(if: Boolean)` __Skip this field if the argument is true__.

Directives can be useful to get out of situations where you otherwise would need to do string manipulation to add and remove fields in your query. Server implementations may also add experimental features by defining completely new directives.

### Mutations

Most discussions of GraphQL focus on data fetching, but any complete data platform needs a way to modify server-side data as well.

In REST, any request might end up causing some side-effects on the server, but by convention it's suggested that one doesn't use GET requests to modify data. GraphQL is similar - technically any query could be implemented to cause a data write. However, it's useful to establish a convention that any operations that cause writes should be sent explicitly via a mutation.

__Just like in queries, if the mutation field returns an object type, you can ask for nested fields__. This can be useful for fetching the new state of an object after an update. Let's look at a simple example mutation:

```json
mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}
```

with variables:

```json
{
  "ep": "JEDI",
  "review": {
    "stars": 5,
    "commentary": "This is a great movie!"
  }
}
```

returns:

```json
{
  "data": {
    "createReview": {
      "stars": 5,
      "commentary": "This is a great movie!"
    }
  }
}
```

Note how createReview field returns the stars and commentary fields of the newly created review. This is especially useful when mutating existing data, for example, when incrementing a field, since we can mutate and query the new value of the field with one request.

You might also notice that, in this example, __the review variable we passed in is not a scalar. It's an input object type__, a special kind of object type that can be passed in as an argument. Learn more about input types on the Schema page.

#### Multiple fields in mutations

A mutation can contain multiple fields, just like a query. There's one important distinction between queries and mutations, other than the name: __While query fields are executed in parallel, mutation fields run in series, one after the other__.

__This means that if we send two incrementCredits mutations in one request, the first is guaranteed to finish before the second begins, ensuring that we don't end up with a race condition with ourselves__.

### Inline Fragments

Like many other type systems, GraphQL schemas include the ability to define interfaces and union types. Learn about them in the schema section.

If you are querying a field that returns an interface or a union type, you will need to use inline fragments to access data on the underlying concrete type. It's easiest to see with an example:

```json
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    ... on Droid {
      primaryFunction
    }
    ... on Human {
      height
    }
  }
}
```

with variables:

```json
{
  "ep": "JEDI"
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "primaryFunction": "Astromech"
    }
  }
}
```

__In this query, the hero field returns the type Character__, which might be either a Human or a Droid depending on the episode argument. __In the direct selection, you can only ask for fields that exist on the Character interface, such as name__.

__To ask for a field on the concrete type__, you __need to use an inline fragment with a type condition__. Because the first fragment is labeled as ... on Droid, the primaryFunction field will only be executed if the Character returned from hero is of the Droid type. Similarly for the height field for the Human type.

__Named fragments can also be used in the same way, since a named fragment always has a type attached__.

#### Meta fields

Given that there are some situations where you don't know what type you'll get back from the GraphQL service, you need some way to determine how to handle that data on the client. GraphQL allows you to request `__typename`, a meta field, at any point in a query to get the name of the object type at that point.

```json
{
  search(text: "an") {
    __typename
    ... on Human {
      name
    }
    ... on Droid {
      name
    }
    ... on Starship {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "search": [
      {
        "__typename": "Human",
        "name": "Han Solo"
      },
      {
        "__typename": "Human",
        "name": "Leia Organa"
      },
      {
        "__typename": "Starship",
        "name": "TIE Advanced x1"
      }
    ]
  }
}
```

In the above query, search returns a union type that can be one of three options. It would be impossible to tell apart the different types from the client without the `__typename` field.

GraphQL services provide a few meta fields, the rest of which are used to expose the Introspection system.

## Schemas and Types

On this page, you'll learn all you need to know about the GraphQL type system and how it describes what data can be queried. Since GraphQL can be used with any backend framework or programming language, we'll stay away from implementation-specific details and talk only about the concepts.

### Type system

If you've seen a GraphQL query before, you know that the GraphQL query language is basically about selecting fields on objects. So, for example, in the following query:

```json
{
  hero {
    name
    appearsIn
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ]
    }
  }
}
```

- We start with a special "root" object
- We select the hero field on that
- For the object returned by hero, we select the `name` and `appearsIn` fields

Because the shape of a GraphQL query closely matches the result, you can predict what the query will return without knowing that much about the server. But it's useful to have an exact description of the data we can ask for - what fields can we select? What kinds of objects might they return? What fields are available on those sub-objects? That's where the schema comes in.

Every GraphQL service defines a set of types which completely describe the set of possible data you can query on that service. Then, when queries come in, they are validated and executed against that schema.

### Type language

GraphQL services can be written in any language. Since we can't rely on a specific programming language syntax, like JavaScript, to talk about GraphQL schemas, we'll define our own simple language. We'll use the "GraphQL schema language" - it's similar to the query language, and allows us to talk about GraphQL schemas in a language-agnostic way.

### Object types and fields

The most basic components of a GraphQL schema are object types, which just represent a kind of object you can fetch from your service, and what fields it has. In the GraphQL schema language, we might represent it like this:

```json
type Character {
  name: String!
  appearsIn: [Episode!]!
}
```

The language is pretty readable, but let's go over it so that we can have a shared vocabulary:

- `Character` is a __GraphQL Object Type__, meaning it's a type with some fields. Most of the types in your schema will be object types.
- `name` and `appearsIn` are __fields on the `Character` type__. That means that name and appearsIn are the only fields that can appear in any part of a GraphQL query that operates on the Character type.
- `String` is one of the __built-in scalar types__ - these are types that resolve to a single scalar object, and can't have sub-selections in the query. We'll go over scalar types more later.
- `String!` __means that the field is non-nullable__, meaning that the GraphQL service promises to always give you a value when you query this field. In the type language, we'll represent those with an exclamation mark.
- `[Episode!]!` represents __an array of `Episode` objects__. Since it is also non-nullable, you can always expect an array (with zero or more items) when you query the appearsIn field. And since Episode! is also non-nullable, you can always expect every item of the array to be an Episode object.

Now you know what a GraphQL object type looks like, and how to read the basics of the GraphQL type language.

### Arguments

Every field on a GraphQL object type can have zero or more arguments, for example the length field below:

```json
type Starship {
  id: ID!
  name: String!
  length(unit: LengthUnit = METER): Float
}
```

All arguments are named. Unlike languages like JavaScript and Python where functions take a list of ordered arguments, all arguments in GraphQL are passed by name specifically. In this case, the length field has one defined argument, unit.

__Arguments can be either required or optional__. When an argument is optional, we can define a default value - if the unit argument is not passed, it will be set to METER by default.

### The Query and Mutation types

Most types in your schema will just be normal object types, but __there are two types that are special within a schema__:

```json
schema {
  query: Query
  mutation: Mutation
}
```

__Every GraphQL service has a query type and may or may not have a mutation type__. These types are the same as a regular object type, but __they are special because they define the entry point of every GraphQL query__. So if you see a query that looks like:

```json
query {
  hero {
    name
  }
  droid(id: "2000") {
    name
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2"
    },
    "droid": {
      "name": "C-3PO"
    }
  }
}
```

__That means that the GraphQL service needs to have a `Query` type__ with `hero` and `droid` fields:

```json
type Query {
  hero(episode: Episode): Character
  droid(id: ID!): Droid
}
```

Mutations work in a similar way - you define fields on the Mutation type, and those are available as the root mutation fields you can call in your query.

It's important to remember that __other than the special status of being the "entry point" into the schema, the Query and Mutation types are the same as any other GraphQL object type__, and their fields work exactly the same way.

### Scalar types

A GraphQL object type has a name and fields, but at some point those fields have to resolve to some concrete data. That's where __the scalar types come in: they represent the leaves of the query__.

In the following query, the `name` and `appearsIn` fields __will resolve to scalar types__:

```json
{
  hero {
    name
    appearsIn
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ]
    }
  }
}
```

__We know this because those fields don't have any sub-fields__ - they are the leaves of the query.

GraphQL comes with a set of default scalar types out of the box:

- `Int`: A signed 32‐bit integer.
- `Float`: A signed double-precision floating-point value.
- `String`: A UTF‐8 character sequence.
- `Boolean`: true or false.
- `ID`: The ID scalar type represents a unique identifier, often used to refetch an object or as the key for a cache. The ID type is serialized in the same way as a String; however, defining it as an ID signifies that it is not intended to be human‐readable.

In most GraphQL service implementations, __there is also a way to specify custom scalar types__. For example, we could define a Date type:

```txt
scalar Date
```

__Then it's up to our implementation to define how that type should be serialized, deserialized, and validated__. For example, you could specify that the Date type should always be serialized into an integer timestamp, and your client should know to expect that format for any date fields.

### Enumeration types

Also called Enums, enumeration types are a __special kind of scalar that is restricted to a particular set of allowed values__. This allows you to:

- Validate that any arguments of this type are one of the allowed values
- Communicate through the type system that a field will always be one of a finite set of values

Here's what an enum definition might look like in the GraphQL schema language:

```json
enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}
```

This means that wherever we use the type Episode in our schema, we expect it to be exactly one of `NEWHOPE`, `EMPIRE`, or `JEDI`.

Note that GraphQL service implementations in various languages will have their own language-specific way to deal with enums. In languages that support enums as a first-class citizen, the implementation might take advantage of that; in a language like JavaScript with no enum support, these values might be internally mapped to a set of integers. However, these details don't leak out to the client, which can operate entirely in terms of the string names of the enum values.

### Lists and Non-Null

Object types, scalars, and enums are the only kinds of types you can define in GraphQL. But when you use the types in other parts of the schema, or in your query variable declarations, you can apply additional type modifiers that affect validation of those values. Let's look at an example:

```json
type Character {
  name: String!
  appearsIn: [Episode]!
}
```

Here, we're using a `String` type and marking it as __Non-Null by adding an exclamation mark, `!`__ after the type name. This means that our server always expects to return a non-null value for this field, and if it ends up getting a null value that will actually __trigger a GraphQL execution error__, letting the client know that something has gone wrong.

The Non-Null type modifier can also be used when defining arguments for a field, which will cause the GraphQL server to return a validation error if a null value is passed as that argument, whether in the GraphQL string or in the variables.

```json
query DroidById($id: ID!) {
  droid(id: $id) {
    name
  }
}
```

with variables:

```json
{
  "id": null
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Variable \"$id\" of non-null type \"ID!\" must not be null.",
      "locations": [
        {
          "line": 1,
          "column": 17
        }
      ]
    }
  ]
}
```

Lists work in a similar way: We can use a type modifier to mark a type as a List, which indicates that this field will return an array of that type. In the schema language, this is denoted by wrapping the type in square brackets, `[` and `]`. It works the same for arguments, where the validation step will expect an array for that value.

The Non-Null and List modifiers can be combined. For example, you can have a List of Non-Null Strings:

```txt
myField: [String!]
```

__This means that the list itself can be null, but it can't have any null members__. For example, in JSON:

```json
myField: null // valid
myField: [] // valid
myField: ["a", "b"] // valid
myField: ["a", null, "b"] // error
```

Now, let's say we defined a Non-Null List of Strings:

```json
myField: [String]!
```

This means that the list itself cannot be null, but it can contain null values:

```json
myField: null // error
myField: [] // valid
myField: ["a", "b"] // valid
myField: ["a", null, "b"] // valid
```

You can arbitrarily nest any number of Non-Null and List modifiers, according to your needs.

### Interfaces

Like many type systems, GraphQL supports interfaces. __An Interface is an abstract type that includes a certain set of fields that a type must include to implement the interface__.

For example, you could have an interface Character that represents any character in the Star Wars trilogy:

```json
interface Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
}
```

This means that any type that implements `Character` __needs to have these exact fields, with these arguments and return types__.

For example, here are some types that might implement Character:

```json
type Human implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  starships: [Starship]
  totalCredits: Int
}
 
type Droid implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  primaryFunction: String
}
```

You can see that __both of these types have all of the fields from the Character interface__, but __also bring in extra fields__, `totalCredits`, `starships` and `primaryFunction`, that are specific to that particular type of character.

Interfaces are useful when you want to return an object or set of objects, but those might be of several different types.

For example, note that the following query produces an error:


```json
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    primaryFunction
  }
}
```

With variable:

```json
{
  "ep": "JEDI"
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Cannot query field \"primaryFunction\" on type \"Character\". Did you mean to use an inline fragment on \"Droid\"?",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ]
    }
  ]
}
```

The __hero field returns the type `Character`__, which means it __might be either a `Human` or a `Droid`__ depending on the episode argument. __In the query above, you can only ask for fields that exist on the Character interface__, which doesn't include `primaryFunction`.

To ask for a field on a specific object type, __you need to use an inline fragment__:

```json
query HeroForEpisode($ep: Episode!) {
  hero(episode: $ep) {
    name
    ... on Droid {
      primaryFunction
    }
  }
}
```

with variable:

```json
{
  "ep": "JEDI"
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "primaryFunction": "Astromech"
    }
  }
}
```

### Union types

Union types share similarities with interfaces; however, they lack the ability to define any shared fields among the constituent types.

```txt
union SearchResult = Human | Droid | Starship
```

Wherever we return a `SearchResult` type in our schema, __we might get a__ `Human`, a `Droid`, or a `Starship`. Note that __members of a union type need to be concrete object types__; __you can't create a union type out of interfaces or other unions__.

In this case, if you query a field that returns the `SearchResult` union type, you need to use an inline fragment to be able to query any fields at all:

```json
{
  search(text: "an") {
    __typename
    ... on Human {
      name
      height
    }
    ... on Droid {
      name
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
```

returns:

```json
{
  "data": {
    "search": [
      {
        "__typename": "Human",
        "name": "Han Solo",
        "height": 1.8
      },
      {
        "__typename": "Human",
        "name": "Leia Organa",
        "height": 1.5
      },
      {
        "__typename": "Starship",
        "name": "TIE Advanced x1",
        "length": 9.2
      }
    ]
  }
}
```

__The `__typename` field resolves to a String which lets you differentiate different data types__ from each other on the client.

Also, __in this case, since `Human` and `Droid` share a common interface (`Character`), you can query their common fields in one place rather than having to repeat the same fields across multiple types__:

```json
{
  search(text: "an") {
    __typename
    ... on Character {
      name
    }
    ... on Human {
      height
    }
    ... on Droid {
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
```

Note that name is still specified on Starship because otherwise it wouldn't show up in the results given that Starship is not a Character!

### Input types

__So far, we've only talked about passing scalar values, like `enums` or `strings`__, as arguments into a field. But __you can also easily pass complex objects__. This is particularly valuable in the case of mutations, where you might want to pass in a whole object to be created. In the GraphQL schema language, `input types` look exactly the same as regular object types, but with the __keyword `input` instead of `type`__:

```json
input ReviewInput {
  stars: Int!
  commentary: String
}
```

Here is how you could use the input object type in a mutation:

```json
mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}
```

with variable:

```json
{
  "ep": "JEDI",
  "review": {
    "stars": 5,
    "commentary": "This is a great movie!"
  }
}
```

returns:

```json
{
  "data": {
    "createReview": {
      "stars": 5,
      "commentary": "This is a great movie!"
    }
  }
}
```

The fields on an input object type can themselves refer to input object types, but you can't mix input and output types in your schema. Input object types also can't have arguments on their fields.

## Validation

By using the type system, it can be predetermined whether a GraphQL query is valid or not. This allows servers and clients to effectively inform developers when an invalid query has been created, without having to rely on runtime checks.

For our Star Wars example, __the file starWarsValidation-test.ts contains a number of queries demonstrating various invalidities__, and is a test file that can be run to exercise the reference implementation's validator.

To start, let's take a complex valid query. This is a nested query, similar to an example from the previous section, but with the duplicated fields factored out into a fragment:

```json

{
  hero {
    ...NameAndAppearances
    friends {
      ...NameAndAppearances
      friends {
        ...NameAndAppearances
      }
    }
  }
}
​
fragment NameAndAppearances on Character {
  name
  appearsIn
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "friends": [
        {
          "name": "Luke Skywalker",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Han Solo",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Leia Organa",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "C-3PO",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        },
        {
          "name": "Han Solo",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Luke Skywalker",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Leia Organa",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        },
        {
          "name": "Leia Organa",
          "appearsIn": [
            "NEWHOPE",
            "EMPIRE",
            "JEDI"
          ],
          "friends": [
            {
              "name": "Luke Skywalker",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "Han Solo",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "C-3PO",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            },
            {
              "name": "R2-D2",
              "appearsIn": [
                "NEWHOPE",
                "EMPIRE",
                "JEDI"
              ]
            }
          ]
        }
      ]
    }
  }
}
```

And this query is valid. Let's take a look at some invalid queries…

__A fragment cannot refer to itself or create a cycle__, as this could result in an unbounded result! Here's the same query above but without the explicit three levels of nesting:


```json
{
  hero {
    ...NameAndAppearancesAndFriends
  }
}

fragment NameAndAppearancesAndFriends on Character {
  name
  appearsIn
  friends {
    ...NameAndAppearancesAndFriends
  }
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Cannot spread fragment \"NameAndAppearancesAndFriends\" within itself.",
      "locations": [
        {
          "line": 11,
          "column": 5
        }
      ]
    }
  ]
}
```

__When we query for fields, we have to query for a field that exists on the given type__. So as `hero` returns a `Character`, we have to query for a field on `Character`. That type does not have a favoriteSpaceship field, so this query is invalid:

```json

# INVALID: favoriteSpaceship does not exist on Character
{
  hero {
    favoriteSpaceship
  }
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Cannot query field \"favoriteSpaceship\" on type \"Character\".",
      "locations": [
        {
          "line": 4,
          "column": 5
        }
      ]
    }
  ]
}
```

Whenever we query for __a field and it returns something other than a `scalar` or an `enum`__, we need to specify what data we want to get back from the field. __`Hero` returns a `Character`, and we've been requesting fields like `name` and `appearsIn` on it; if we omit that, the query will not be valid__:

```json
# INVALID: hero is not a scalar, so fields are needed
{
  hero
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Field \"hero\" of type \"Character\" must have a selection of subfields. Did you mean \"hero { ... }\"?",
      "locations": [
        {
          "line": 3,
          "column": 3
        }
      ]
    }
  ]
}
```

Similarly, __if a field is a `scalar`, it doesn't make sense to query for additional fields on it__, and doing so will make the query invalid:

```json

# INVALID: name is a scalar, so fields are not permitted
{
  hero {
    name {
      firstCharacterOfName
    }
  }
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Field \"name\" must not have a selection since type \"String!\" has no subfields.",
      "locations": [
        {
          "line": 4,
          "column": 10
        }
      ]
    }
  ]
}
```

Earlier, it was noted that a query can only query for fields on the type in question; when we query for hero which returns a Character, we can only query for fields that exist on Character. What happens if we want to query for R2-D2s primary function, though?

```json
# INVALID: primaryFunction does not exist on Character
{
  hero {
    name
    primaryFunction
  }
}
```

returns:

```json
{
  "errors": [
    {
      "message": "Cannot query field \"primaryFunction\" on type \"Character\". Did you mean to use an inline fragment on \"Droid\"?",
      "locations": [
        {
          "line": 5,
          "column": 5
        }
      ]
    }
  ]
}
```

That query is invalid, because `primaryFunction` is not a field on `Character`. We want some way of indicating that we wish to fetch `primaryFunction` if the `Character` is a `Droid`, and to ignore that field otherwise. We can use the fragments we introduced earlier to do this. By setting up a fragment defined on `Droid` and including it, we ensure that we only query for primaryFunction where it is defined.

```json
{
  hero {
    name
    ...DroidFields
  }
}

fragment DroidFields on Droid {
  primaryFunction
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "primaryFunction": "Astromech"
    }
  }
}
```

This query is valid, but it's a bit verbose; named fragments were valuable above when we used them multiple times, but we're only using this one once. Instead of using a named fragment, we can use an inline fragment; this still allows us to indicate the type we are querying on, but without naming a separate fragment:

```json
{
  hero {
    name
    ... on Droid {
      primaryFunction
    }
  }
}
```

returns:

```json
{
  "data": {
    "hero": {
      "name": "R2-D2",
      "primaryFunction": "Astromech"
    }
  }
}
```

This has just scratched the surface of the validation system; there are a number of validation rules in place to ensure that a GraphQL query is semantically meaningful. The specification goes into more detail about this topic in the “Validation” section, and the validation directory in GraphQL.js contains code implementing a specification-compliant GraphQL validator.

## Execution

After being validated, a GraphQL query is executed by a GraphQL server which returns a result that mirrors the shape of the requested query, typically as JSON.

GraphQL cannot execute a query without a type system, let's use an example type system to illustrate executing a query. This is a part of the same type system used throughout the examples in these articles:

```json
type Query {
  human(id: ID!): Human
}
 
type Human {
  name: String
  appearsIn: [Episode]
  starships: [Starship]
}
 
enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}
 
type Starship {
  name: String
}
```

In order to describe what happens when a query is executed, let's use an example to walk through.

```json
{
  human(id: 1002) {
    name
    appearsIn
    starships {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "human": {
      "name": "Han Solo",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "starships": [
        {
          "name": "Millenium Falcon"
        },
        {
          "name": "Imperial shuttle"
        }
      ]
    }
  }
}
```

__You can think of each field in a GraphQL query as a function or method of the previous type which returns the next type__. In fact, this is exactly how GraphQL works. __Each field on each type is backed by a function called the resolver__ which is provided by the GraphQL server developer. When a field is executed, __the corresponding resolver is called to produce the next value__.

__If a field produces a scalar value like a string or number, then the execution completes__. However __if a field produces an object value then the query will contain another selection of fields which apply to that object__. This __continues until scalar values are reached__. GraphQL queries always end at scalar values.

### Root fields & resolvers

At the top level of every GraphQL server is a type that represents all of the possible entry points into the GraphQL API, it's often called the __`Root type` or the Query type__.

In this example, our Query type provides a field called human which accepts the argument id. The resolver function for this field likely accesses a database and then constructs and returns a `Human` object.

```json
Query: {
  human(obj, args, context, info) {
    return context.db.loadHumanByID(args.id).then(
      userData => new Human(userData)
    )
  }
}
```

This example is written in JavaScript, however GraphQL servers can be built in many different languages. __A resolver function receives four arguments__:

- `obj` The previous object, which __for a field on the root Query type is often not used__.
- `args` The __arguments provided to the field__ in the GraphQL query.
- `context` A value which is __provided to every resolver and holds important contextual information__ like the currently logged in user, or access to a database.
- `info` A value which __holds field-specific information relevant to the current query as well as the schema__ details, also refer to type `GraphQLResolveInfo` for more details.

### Asynchronous resolvers

Let's take a closer look at what's happening in this resolver function.

```json
human(obj, args, context, info) {
  return context.db.loadHumanByID(args.id).then(
    userData => new Human(userData)
  )
}
```

The __`context` is used to provide access to a database__ which is used to load the data for a user by the id provided as an argument in the GraphQL query. Since loading from a database is an asynchronous operation, this returns a Promise. In JavaScript, Promises are used to work with asynchronous values, but the same concept exists in many languages, often called Futures, Tasks or Deferred. When the database returns, we can construct and return a new Human object.

Notice that __while the resolver function needs to be aware of Promises, the GraphQL query does not__. It simply expects the human field to return something which it can then ask the name of. During execution, GraphQL will wait for Promises, Futures, and Tasks to complete before continuing and will do so with optimal concurrency.

### Trivial resolvers

__Now that a Human object is available, GraphQL execution can continue with the fields requested on it__.

```json
Human: {
  name(obj, args, context, info) {
    return obj.name
  }
}
```

A GraphQL server is powered by a type system which is used to determine what to do next. Even before the human field returns anything, __GraphQL knows that the next step will be to resolve fields on the Human type__ since the type system tells it that the human field will return a Human.

Resolving the name in this case is very straight-forward. The name resolver function is called and the __obj argument is the new Human object returned from the previous field__. In this case, we expect that Human object to have a name property which we can read and return directly.

In fact, many GraphQL libraries will let you omit resolvers this simple and will just assume that if a resolver isn't provided for a field, that a property of the same name should be read and returned.

### Scalar coercion

__While the `name` field is being resolved, the `appearsIn` and `starships` fields can be resolved concurrently__. The `appearsIn` field could also have a trivial resolver, but let's take a closer look:

```json
Human: {
  appearsIn(obj) {
    return obj.appearsIn // returns [ 4, 5, 6 ]
  }
}
```

Notice that our type system claims `appearsI`n will return `Enum` values with known values, however this function is returning numbers! Indeed if we look up at the result we'll see that the appropriate Enum values are being returned. What's going on?

__This is an example of scalar coercion__. The type system knows what to expect __and will convert the values returned by a resolver function into something that upholds the API contract__. In this case, there may be an Enum defined on our server which uses numbers like 4, 5, and 6 internally, but represents them as Enum values in the GraphQL type system.

### List resolvers

We've already seen a bit of what happens when a field returns a list of things with the appearsIn field above. It returned a list of enum values, and since that's what the type system expected, each item in the list was coerced to the appropriate enum value. What happens when the starships field is resolved?

```json
Human: {
  starships(obj, args, context, info) {
    return obj.starshipIDs.map(
      id => context.db.loadStarshipByID(id).then(
        shipData => new Starship(shipData)
      )
    )
  }
}
```

__The resolver for this field is not just returning a Promise, it's returning a list of Promises__. The Human object had a list of ids of the Starships they piloted, but we need to go load all of those ids to get real Starship objects.

__GraphQL will wait for all of these Promises concurrently before continuing__, and __when left with a list of objects, it will concurrently continue yet again to load the name field on each of these items__.

### Producing the result

As each field is resolved, __the resulting value is placed into a key-value map with the field name (or alias) as the key and the resolved value as the value__. This continues from the bottom leaf fields of the query all the way back up to the original field on the root Query type. Collectively these produce a structure that mirrors the original query which can then be sent (typically as JSON) to the client which requested it.

Let's take one last look at the original query to see how all these resolving functions produce a result:

```json
{
  human(id: 1002) {
    name
    appearsIn
    starships {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "human": {
      "name": "Han Solo",
      "appearsIn": [
        "NEWHOPE",
        "EMPIRE",
        "JEDI"
      ],
      "starships": [
        {
          "name": "Millenium Falcon"
        },
        {
          "name": "Imperial shuttle"
        }
      ]
    }
  }
}
```

## Introspection

It's often useful to __ask a GraphQL schema for information about what queries it supports__. GraphQL allows us to do so using the introspection system!

For our Star Wars example, the file starWarsIntrospection-test.ts contains a number of queries demonstrating the introspection system, and is a test file that can be run to exercise the reference implementation's introspection system.

We designed the type system, so we know what types are available, but if we didn't, we can ask GraphQL, by querying the __schema field, always available on the root type of a Query. Let's do so now, and ask what types are available.

```json
{
  __schema {
    types {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "__schema": {
      "types": [
        {
          "name": "Query"
        },
        {
          "name": "String"
        },
        {
          "name": "ID"
        },
        {
          "name": "Mutation"
        },
        {
          "name": "Episode"
        },
        {
          "name": "Character"
        },
        {
          "name": "Int"
        },
        {
          "name": "LengthUnit"
        },
        {
          "name": "Human"
        },
        {
          "name": "Float"
        },
        {
          "name": "Droid"
        },
        {
          "name": "FriendsConnection"
        },
        {
          "name": "FriendsEdge"
        },
        {
          "name": "PageInfo"
        },
        {
          "name": "Boolean"
        },
        {
          "name": "Review"
        },
        {
          "name": "ReviewInput"
        },
        {
          "name": "Starship"
        },
        {
          "name": "SearchResult"
        },
        {
          "name": "__Schema"
        },
        {
          "name": "__Type"
        },
        {
          "name": "__TypeKind"
        },
        {
          "name": "__Field"
        },
        {
          "name": "__InputValue"
        },
        {
          "name": "__EnumValue"
        },
        {
          "name": "__Directive"
        },
        {
          "name": "__DirectiveLocation"
        }
      ]
    }
  }
}
```

Wow, that's a lot of types! What are they? Let's group them:

- `Query`, `Character`, `Human`, `Episode`, `Droid` - These are the ones that we defined in our type system.
- `String`, `Boolean` - These are built-in scalars that the type system provided.
- `__Schema`, `__Type`, `__TypeKind`, `__Field`, `__InputValue`, `__EnumValue`, `__Directive` - These __all are preceded with a double underscore, indicating that they are part of the introspection system__.

Now, let's try and figure out a good place to start exploring what queries are available. When we designed our type system, we specified what type all queries would start at; let's ask the introspection system about that!

```json
{
  __schema {
    queryType {
      name
    }
  }
}
```

returns:

```json
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      }
    }
  }
}
```

And that matches what we said in the type system section, that the Query type is where we will start! Note that the naming here was just by convention; we could have named our Query type anything else, and it still would have been returned here had we specified it was the starting type for queries. Naming it Query, though, is a useful convention.

It is often useful to examine one specific type. Let's take a look at the Droid type:

```json
{
  __type(name: "Droid") {
    name
  }
}
```

returns:

```json
{
  "data": {
    "__type": {
      "name": "Droid"
    }
  }
}
```

What if we want to know more about Droid, though? For example, is it an interface or an object?

```json
{
  __type(name: "Droid") {
    name
    kind
  }
}
```

returns:

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "kind": "OBJECT"
    }
  }
}
```

`kind` returns a `__TypeKind` enum, one of whose values is `OBJECT`. If we asked about Character instead we'd find that it is an interface:

```json
{
  __type(name: "Character") {
    name
    kind
  }
}
```

returns:

```json
{
  "data": {
    "__type": {
      "name": "Character",
      "kind": "INTERFACE"
    }
  }
}
```

It's useful for an object to know what fields are available, so let's ask the introspection system about Droid:

```json
{
  __type(name: "Droid") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
```

returns:

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "fields": [
        {
          "name": "id",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "name",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "friends",
          "type": {
            "name": null,
            "kind": "LIST"
          }
        },
        {
          "name": "friendsConnection",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "appearsIn",
          "type": {
            "name": null,
            "kind": "NON_NULL"
          }
        },
        {
          "name": "primaryFunction",
          "type": {
            "name": "String",
            "kind": "SCALAR"
          }
        }
      ]
    }
  }
}
```

Those are our fields that we defined on Droid!

id looks a bit weird there, it has no name for the type. That's because it's a “wrapper” type of kind NON_NULL. If we queried for ofType on that field's type, we would find the ID type there, telling us that this is a non-null ID.

Similarly, both friends and appearsIn have no name, since they are the LIST wrapper type. We can query for ofType on those types, which will tell us what these are lists of.

```json
{
  __type(name: "Droid") {
    name
    fields {
      name
      type {
        name
        kind
        ofType {
          name
          kind
        }
      }
    }
  }
}
```

returns:

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "fields": [
        {
          "name": "id",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "ID",
              "kind": "SCALAR"
            }
          }
        },
        {
          "name": "name",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "String",
              "kind": "SCALAR"
            }
          }
        },
        {
          "name": "friends",
          "type": {
            "name": null,
            "kind": "LIST",
            "ofType": {
              "name": "Character",
              "kind": "INTERFACE"
            }
          }
        },
        {
          "name": "friendsConnection",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": "FriendsConnection",
              "kind": "OBJECT"
            }
          }
        },
        {
          "name": "appearsIn",
          "type": {
            "name": null,
            "kind": "NON_NULL",
            "ofType": {
              "name": null,
              "kind": "LIST"
            }
          }
        },
        {
          "name": "primaryFunction",
          "type": {
            "name": "String",
            "kind": "SCALAR",
            "ofType": null
          }
        }
      ]
    }
  }
}
```

Let's end with a feature of the introspection system particularly useful for tooling; let's ask the system for documentation!


```json
{
  __type(name: "Droid") {
    name
    description
  }
}
```

returns:

```json
{
  "data": {
    "__type": {
      "name": "Droid",
      "description": null
    }
  }
}
```

So we can access the documentation about the type system using introspection, and create documentation browsers, or rich IDE experiences.

This has just scratched the surface of the introspection system; we can query for enum values, what interfaces a type implements, and more. We can even introspect on the introspection system itself. The specification goes into more detail about this topic in the “Introspection” section, and the introspection file in GraphQL.js contains code implementing a specification-compliant GraphQL query introspection system.

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

- Establecemos una relación 1:n bidireccional entre  _User_ y _Photo_ con los campos _postedBy_ y _postedPhotos_. Podemos en todo momento saber a partir de un _User_ cuales son sus _Photos_ y desde una _Photo_ saber cual es el usuario que la creo
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

Cuando los argumentos de entrada se utilizan en más de una función nos puede interesar un _input_. Aqui por ejemplo definimos un tipo:

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

