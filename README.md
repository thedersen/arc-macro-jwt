# arc-macro-jwt

Use JWT authentication with [Architect](https://arc.codes) HTTP APIs (APIG HTTP Api only).

### Install:

`npm i arc-macro-jwt`

Add to your .arc-file:

```arc
@app
myapp

@aws
apigateway http

@jwt
issuer https://example.auth0.com/ #Issuer of JWT
audience https://example.com,https://example2.com #Audience in the JWT
identitySource $request.header.Authorization #Where is the token source
scopes read:foo,write:foo #Not required
default false #Set to true to secure all routes (@jwt pragmas in .arc-config are ignored)

@http
get /
get /foo
get /bar

@macros
arc-macro-jwt
```

And add to individual .arc-config files for routes that needs auth:

```arc
@jwt
scopes read:bar,write:bar #Not required (use default scopes or none when not specified)
```

See [AWS::Serverless::HttpApi/HttpApiAuth](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-httpapi-httpapiauth.html) for more information.
