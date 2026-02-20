import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Last Mile Connectivity API',
      version: '1.0.0',
      description: 'API documentation for the Last Mile Connectivity application',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Ensure Swagger finds the route files correctly. 
  // Using generic relative path from project root usually works best with ts-node.
  apis: ['./routes/*.ts'], 
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
