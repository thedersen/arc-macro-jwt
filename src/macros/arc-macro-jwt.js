const toLogicalID = require('@architect/utils/to-logical-id');
const yargs = require('yargs-parser');

module.exports = function(arc, cfn) {
  if (!arc.jwt) {
    return cfn;
  }

  const existingApi = getExistingApiName(cfn);
  const apiName = existingApi || `${toLogicalID(arc.app[0])}Api`;

  if (!existingApi) {
    createHttpApiResource(apiName, cfn);
  }

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
    const secureRoutes = arc.http
      .map(route => yargs(route))
      .filter(route => Boolean(route.jwt));

    for (const route of secureRoutes) {
      const resource = findResourceForRoute(cfn, route._[0], route._[1]);
      const authScopes =
        route.jwt === true ? [] : route.jwt.split(',').map(s => s.trim());

      cfn.Resources[resource].Properties.Events[
        `${resource}Event`
      ].Properties.Auth = {
        Authorizer: 'OAuth2Authorizer',
        AuthorizationScopes: authScopes,
      };
    }
  }

  return cfn;
};

function findResourceForRoute(cfn, method, path) {
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
    )
    .filter(
      resource =>
        cfn.Resources[resource].Properties.Events[`${resource}Event`].Properties
          .Path === path
    )
    .find(
      resource =>
        cfn.Resources[resource].Properties.Events[`${resource}Event`].Properties
          .Method === method.toUpperCase()
    );
}

function getExistingApiName(cfn) {
  return Object.keys(cfn.Resources).find(
    resource => cfn.Resources[resource].Type === 'AWS::Serverless::HttpApi'
  );
}

function createHttpApiResource(apiName, cfn) {
  cfn.Resources[apiName] = {
    Type: 'AWS::Serverless::HttpApi',
    Properties: {
      FailOnWarnings: true,
    },
  };

  cfn.Outputs.HTTP = {
    Description: 'API Gateway',
    Value: {
      'Fn::Sub': [
        'https://${idx}.execute-api.${AWS::Region}.amazonaws.com', // eslint-disable-line no-template-curly-in-string
        {
          idx: {
            Ref: apiName,
          },
        },
      ],
    },
  };

  for (const resource of Object.keys(cfn.Resources)) {
    if (cfn.Resources[resource].Type === 'AWS::Serverless::Function') {
      const eventname = `${resource}Event`;
      cfn.Resources[resource].Properties.Events[eventname].Properties.ApiId = {
        Ref: apiName,
      };

      if (cfn.Resources[resource].Properties.Events.ImplicitApi) {
        delete cfn.Resources[resource].Properties.Events.ImplicitApi;
      }
    }
  }
}

function getConfig(arc) {
  const defaultConfig = {
    issuer: '',
    audience: [],
    scopes: [],
    identitySource: '$request.header.Authorization',
    default: false,
  };

  return arc.auth.reduce((cfg, value) => {
    if (value[0] === 'audience' || value[0] === 'scopes') {
      cfg[value[0]] = value[1].split(',').map(s => s.trim());
    } else {
      cfg[value[0]] = value[1];
    }

    return cfg;
  }, defaultConfig);
}
