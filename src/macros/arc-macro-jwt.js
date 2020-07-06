const parse = require('@architect/parser');
const fs = require('fs');
const path = require('path');

module.exports = function(arc, cfn) {
  if (!arc.jwt) {
    return cfn;
  }

  const apiName = getApiName(cfn);
  const config = getConfig(arc);
  const httpApi = cfn.Resources[apiName];

  httpApi.Properties.Auth = {
    Authorizers: {
      OAuth2Authorizer: {
        AuthorizationScopes: config.scopes,
        JwtConfiguration: {
          issuer: config.issuer,
          audience: config.audience,
        },
        IdentitySource: config.identitySource,
      },
    },
  };

  if (config.default) {
    httpApi.Properties.Auth.DefaultAuthorizer = 'OAuth2Authorizer';
  } else {
    for (const resource of findRoutes(cfn)) {
      const pathToCode = cfn.Resources[resource].Properties.CodeUri;
      const config = getRouteConfig(pathToCode);

      if (config !== false) {
        cfn.Resources[resource].Properties.Events[
          `${resource}Event`
        ].Properties.Auth = {
          Authorizer: 'OAuth2Authorizer',
          AuthorizationScopes: config.scopes,
        };
      }
    }
  }

  return cfn;
};

function findRoutes(cfn) {
  return Object.keys(cfn.Resources)
    .filter(
      resource => cfn.Resources[resource].Type === 'AWS::Serverless::Function'
    )
    .filter(resource =>
      Boolean(cfn.Resources[resource].Properties.Events[`${resource}Event`])
    )
    .filter(
      resource =>
        cfn.Resources[resource].Properties.Events[`${resource}Event`].Type ===
        'HttpApi'
    );
}

function getApiName(cfn) {
  return Object.keys(cfn.Resources).find(
    resource => cfn.Resources[resource].Type === 'AWS::Serverless::HttpApi'
  );
}

function splitStrings([key, value]) {
  if (key === 'audience' || key === 'scopes') {
    return [key, value.split(',')];
  }

  return [key, value];
}

function getConfig(arc) {
  const defaultConfig = {
    issuer: '',
    audience: [],
    scopes: [],
    identitySource: '$request.header.Authorization',
    default: false,
  };

  return {
    ...defaultConfig,
    ...Object.fromEntries(arc.jwt.map((setting) => splitStrings(setting))),
  };
}

function getRouteConfig(pathToCode) {
  const defaultConfig = {
    scopes: [],
  };
  const arcFile = path.join(pathToCode, '.arc-config');
  const exists = fs.existsSync(arcFile);

  if (exists) {
    const raw = fs.readFileSync(arcFile).toString().trim();
    const config = parse(raw);

    if (config.jwt) {
      return {
        ...defaultConfig,
        ...Object.fromEntries(config.jwt.map((setting) => splitStrings(setting))),
      };
    }
  }
  return false;
}
