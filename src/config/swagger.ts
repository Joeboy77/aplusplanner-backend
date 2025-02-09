import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "A+ Planner API",
      version: "1.0.0",
      description: "API Documentation for A+ Planner",
    },
    servers: [{ url: "http://localhost:8080" }],
    components: {
      securitySchemes: {
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token", 
        },
      },
    },
    security: [{ CookieAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};


const swaggerDocs = swaggerJsDoc(swaggerOptions);

export { swaggerUi, swaggerDocs };
