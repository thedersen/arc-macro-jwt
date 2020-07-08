@app
test-jwt

@aws
region eu-central-1
apigateway http

@http
get /foo
post /foo
get /bar/:baz

@jwt
issuer https://example.auth0.com/ #Issuer of JWT
audience https://example.com,https://example2.com #Audience in the JWT
identitySource $request.header.Authorization #Default header.Authorization
scopes read:foo,write:foo #Not required
default false #Optionally secure all routes (@jwt pragmas in .arc-config are ignored)

@macros
arc-macro-jwt
