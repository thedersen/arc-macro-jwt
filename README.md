# arc-macro-jwt

Use JWT authentication with [Architect](https://arc.codes) HTTP APIs.

## Ok..How?!

Install:

`npm i arc-macro-jwt`

And add to your .arc-file:

```arc
@app
myapp

@jwt
issuer https://example.auth0.com/ #Issuer of JWT
audience https://example.com,https://example2.com #Audience in the JWT
identitySource $request.header.Authorization #Where is the token source
scopes read:foo,write:foo #Not required
default false #Set to true to secure all routes (--auth flags in @http are ignored)

@http
get / #Not secured
get /foo --jwt #Secured with default scopes
get /bar --jwt read:bar,... #Secured with specified scopes

@macros
architect/macro-http-api #Required until HTTP APIs are default in arc
arc-macro-jwt
```

See [AWS::Serverless::HttpApi/HttpApiAuth](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-httpapi-httpapiauth.html) for more information.
