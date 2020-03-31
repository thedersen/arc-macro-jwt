@app
test-auth

@http
get /foo
post /foo --auth
get /bar --auth read:bar,write:bar

@auth
issuer https://example.auth0.com/ #Issuer of JWT
audience https://example.com,https://example2.com #Audience in the JWT
identitySource $request.header.Authorization #Default header.Authorization
scopes read:foo,write:foo #Not required
default false #Optionally secure all routes (--auth flags in @http are ignored)

@macros
architect/macro-http-api
arc-macro-auth
